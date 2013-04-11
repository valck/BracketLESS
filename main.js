/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 *
 * BraketLESS - A less compiler for Brackets
 * This extension uses the LESS bundle that is distributed with Brackets.
 *
 * Credit where it's due: I found helpful code within the w3c validator & related 
 * files extensions for Brackets. More extensions can be found here:
 * https://github.com/adobe/brackets/wiki/Brackets-Extensions
 *
 * The Windows based simpLESS compiler inspired me to write this.
 *
 * @todo Implement use of the bundled Async libs & give some more options like
 * white space & comment removal
 *
 */

define(function (require, exports, module) {
    
    'use strict';

    var DocumentManager     = brackets.getModule("document/DocumentManager"),
        Commands            = brackets.getModule("command/Commands"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        Menus               = brackets.getModule("command/Menus"),
        FileUtils	        = brackets.getModule("file/FileUtils"),
		LessParser			= require("LessParser").LessParser;
    
    var PREFERENCES_KEY = "com.adobe.brackets.bracketless",
        BRACKETLESS_ENABLED = "bracketless.enabled", 
        _selfEnabled = false,
        _pStore = PreferencesManager.getPreferenceStorage(PREFERENCES_KEY),
        _errorTimeout = 10000;
    
    
    /* Style sheet loader */
    function _loadStyles(relPath) {
        $("<link rel='stylesheet' type='text/css'></link>")
            .attr("href", require.toUrl("./" + relPath))
            .appendTo(document.head);
    }
    
    /* Load our CSS */
    _loadStyles("bracketless.css");
    
    /* Some LESS compilation options */
    LessParser.options = { 
        removeLineEndings: true, /* Remove line endings */ 
        removeExcessWhitespace: true, /* Remove excess whitespace */ 
        removeCSSComments: true, /* Remove comments */ 
        insertLoveMessage: true, /* Insert the BracketLESS love message at the top of CSS files */
    }
    
    /* Adds an error message to the GUI */
    function _showErrorMessage(msg) {
     
        var editorHolder = $("#editor-holder"),
            holder = $("<div></div>").addClass("bracketless-error").html("LESS Compilation Error: "),
            errorMsg = $("<span></span>").html(msg);
            editorHolder.before(holder.append(errorMsg));
        
        holder.slideDown(function(){EditorManager.resizeEditor(); });
        
        setTimeout(function(){ $(holder).slideUp(function(){ $(this).remove(); EditorManager.resizeEditor(); });  }, _errorTimeout);
        
    }
    
    /* Removes all error messages that may stackup */
    function _hideErrorMessages() {
     
        $(".bracketless-error").slideUp(function() { EditorManager.resizeEditor(); });
        
    }
    
    /* Run compilation on .less document save */
    $(DocumentManager).on("documentSaved", function (event, doc) {
        
        if(_bracketLessIsEnabled()) {
            
            var fExt = doc.file.name.split(".").pop();		
                
            if(fExt === "less") {	
                var cssSavePath = doc.file.fullPath.replace(".less", ".css");
                
                LessParser.parseLessFile(doc.file, cssSavePath)
                    .done(function (response) { _hideErrorMessages(); })
                    .fail(function (err) { _showErrorMessage(err.Text); console.log(err); });
            }
            
        }
		
    });
    
    /* Are we enabled or not? */
    function _bracketLessIsEnabled() {     
        return _selfEnabled;        
    }
    
    /* Toggle BracketLESS */
    function _handleEnableBracketLess() {
        
        if(!_bracketLessIsEnabled()){
            _selfEnabled = true;
            CommandManager.get(BRACKETLESS_ENABLED).setChecked(true);
        } else {
            _selfEnabled = false;
            CommandManager.get(BRACKETLESS_ENABLED).setChecked(false);
        }
        
        _pStore.setValue("enabled", _selfEnabled);
        PreferencesManager.savePreferences();        
    }
    
    /* Add the menu ability to enable / disable BracketLESS */
    CommandManager.register("Enable BracketLESS", BRACKETLESS_ENABLED, _handleEnableBracketLess);
    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    menu.addMenuItem(BRACKETLESS_ENABLED, "", Menus.AFTER, "jslint.toggleEnabled");

    /* Turn ourself on if we've been turned on in another session */
    if(_pStore.getValue("enabled")) _handleEnableBracketLess();
    

});