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
		NativeFileSystem    = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
		LessParser			= require("LessParser").LessParser,
		NodeConnection      = brackets.getModule("utils/NodeConnection"),
		AppInit       		= brackets.getModule("utils/AppInit"),
        ExtensionUtils 		= brackets.getModule("utils/ExtensionUtils"),
        NativeApp               = brackets.getModule("utils/NativeApp");
	
	// Helper function that chains a series of promise-returning
    // functions together via their done callbacks.
    function chain() {
        var functions = Array.prototype.slice.call(arguments, 0);
        if (functions.length > 0) {
            var firstFunction = functions.shift();
            var firstPromise = firstFunction.call();
            firstPromise.done(function () {
                chain.apply(null, functions);
            });
        }
    }
    
    var PREFERENCES_KEY = "com.adobe.brackets.bracketless",
        BRACKETLESS_ENABLED = "bracketless.enabled", 
		COMMAND_ID      = "com.adobe.brackets.bracketless.parseCurrentDocument",
        _selfEnabled = false,
        _pStore = PreferencesManager.getPreferenceStorage(PREFERENCES_KEY),
        _errorTimeout = 5000,
		_nodeConnection,
		CURRENT_VERSION_ID = "tag:github.com,2008:Repository/6970826/v1.2",
		GIT_HUB_RELEASE_URL = "https://github.com/olsgreen/BracketLESS/releases.atom";
		
	// Helper function that chains a series of promise-returning
    // functions together via their done callbacks.
    function chain() {
        var functions = Array.prototype.slice.call(arguments, 0);
        if (functions.length > 0) {
            var firstFunction = functions.shift();
            var firstPromise = firstFunction.call();
            firstPromise.done(function () {
                chain.apply(null, functions);
            });
        }
    }
	
	AppInit.appReady(function () {
	
        // Create a new node connection. Requires the following extension:
        _nodeConnection = new NodeConnection();
        
        // Every step of communicating with node is asynchronous, and is
        // handled through jQuery promises. To make things simple, we
        // construct a series of helper functions and then chain their
        // done handlers together. Each helper function registers a fail
        // handler with its promise to report any errors along the way.
        
        
        // Helper function to connect to node
        function connect() {
            var connectionPromise = _nodeConnection.connect(true);
            connectionPromise.fail(function () {
                console.error("[bracketLESS] failed to connect to node");
            });
            return connectionPromise;
        }
        
        // Helper function that loads our domain into the node server
        function loadBracketLessDomain() {
            var path = ExtensionUtils.getModulePath(module, "node/BracketLess");
            var loadPromise = _nodeConnection.loadDomains([path], true);
            loadPromise.fail(function () {
                console.log("[bracketLESS] failed to load domain");
            });
            return loadPromise;
        }

        // Call all the helper functions in order
        chain(connect, loadBracketLessDomain, checkForUpdate);
        
    });
	
	function checkForUpdate() {
		
		var updatePromise = _nodeConnection.domains.bracketless.checkForUpdate(GIT_HUB_RELEASE_URL, CURRENT_VERSION_ID)
			.done(function(response) {
				
				/*console.log(response);
				//console.log(response.currentVersion, CURRENT_VERSION_ID);
				
				if(response.version.currentVersion != null && response.version.currentVersion != CURRENT_VERSION_ID) {
				
					_showErrorMessage("There is a new version of BracketLESS available ("+ response.version.humanVersion +"). <a href=\"\">Click here to install it.</a>", 'info')
				
				}*/
					
			}).fail(function(response) {
			
			//Shouldn't be here doing this!!!!!
			
				if(response.version.current != null && response.version.current != CURRENT_VERSION_ID) {
				
					var link = $("<a target=\"_blank\" href=\"javascript:void(0)\">Get it now ></a>"),
						msg = $("<span></span>").html("<b>:</b> There is a new version ("+ response.version.readable +") of BracketLESS available. ").append(link);

					link.click(function() {						
						NativeApp.openURLInDefaultBrowser(response.version.releaseUrl);					
					});
				
					_showErrorMessage(msg, 'info', 20000);
				
				}
			});
					
			return updatePromise;
		
	}
    
    // Style sheet loader
    function _loadStyles(relPath) {
        $("<link rel='stylesheet' type='text/css'></link>")
            .attr("href", require.toUrl("./" + relPath))
            .appendTo(document.head);
    }
    
    // Load our CSS
    _loadStyles("bracketless.css");
    
    // Some LESS compilation options
    LessParser.options = { 
        removeLineEndings: true, // Remove line endings
        removeExcessWhitespace: true, // Remove excess whitespace 
        removeCSSComments: true, // Remove comments
        insertLoveMessage: true, // Insert the BracketLESS love message at the top of CSS files
    }
    
    // Adds an error message to the GUI
    function _showErrorMessage(msg, type, delay) {
     
		if(!type) type = 'error';
		if(!delay) delay = _errorTimeout;
	 
        var editorHolder = $("#editor-holder"),
            holder = $("<div></div>").addClass("bracketless-msg").addClass(type).html("<span class=\"icon\"></span>"),
            errorMsg = $("<span class=\"msg\"></span>").html("<b>LESS</b>").append(msg);
			
            editorHolder.before(holder.append(errorMsg).append($('<br style="clear:both; float: none;"/>')));
        
        holder.slideDown(function(){EditorManager.resizeEditor(); });
        
        setTimeout(function(){ $(holder).slideUp(function(){ $(this).remove(); EditorManager.resizeEditor(); });  }, delay);
        
    }
    
    // Removes all error messages that may stackup
    function _hideErrorMessages() {
     
        $(".bracketless-msg").slideUp(function() { EditorManager.resizeEditor(); });
        
    }
    
    // Run compilation on .less document save
    $(DocumentManager).on("documentSaved", function (event, doc) {
        
        if(_bracketLessIsEnabled() && doc.file.name.split(".").pop() === 'less') {            
            parseLESSFile(doc.file);            
        }
		
    });
	
	// Parse a file
	function parseLESSFile (file) {
		
		var filePath, cssFilename, cssSavePath;
		
		function doParse(file, savePath) {
			LessParser.parseLessFile(file, savePath)
				.done(function (response) { _hideErrorMessages(); _showErrorMessage('<b>:</b> ' + cssFilename.charAt(0).toUpperCase() + cssFilename.slice(1) + ' saved', 'success');})
				.fail(function (err) { _showErrorMessage(err.Text); });
		}
	
		var fExt = file.name.split(".").pop();		
                
        if(fExt === "less") {	
		
			filePath = FileUtils.convertWindowsPathToUnixPath(file.fullPath.replace(file.name, '')),
			cssFilename = file.name.replace(".less", ".css"),        
			cssSavePath = file.fullPath.replace(".less", ".css"); 
			
			// We check to see whether we're using the /x/less -> /x/css folder structure
			// if we are we save the folder in the coresponding css folder, otherwise we save in
			// the same folder as the less file.		
			
			var cssPathToCheck = FileUtils.canonicalizeFolderPath(filePath).substr(0, FileUtils.canonicalizeFolderPath(filePath).length - 4) + 'css';
				
			NativeFileSystem.resolveNativeFileSystemPath(cssPathToCheck 
                            , function(entry) { 
								doParse(file, cssPathToCheck + '/' + cssFilename);
							}
                            , function(err) {
								doParse(file, cssSavePath);
							 });
			
        } else {		
			_showErrorMessage('<b>:</b> ' + file.name + ' is not a LESS file');
		}
	
	}
	
	// Parse current editor doc
	function saveAndParseCurrentDocument () {
	
		var editor = EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }		
		
		// editor.document.isDirty is reporting false here??? hence no check
		CommandManager.execute("file.save").done(function () {		
			parseLESSFile(editor.document.file);	
		});
		
    }
	
    // Are we enabled or not?
    function _bracketLessIsEnabled() {     
        return _selfEnabled;        
    }
    
    // Toggle BracketLESS
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
    
    // Add the menu ability to enable / disable BracketLESS
    CommandManager.register("Auto-parse LESS to CSS", BRACKETLESS_ENABLED, _handleEnableBracketLess);
    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    menu.addMenuItem(BRACKETLESS_ENABLED, "", Menus.AFTER, "jslint.toggleEnabled");
	
	// Add the ability to run BracketLESS via shortcut
	CommandManager.register("Save as LESS", COMMAND_ID, saveAndParseCurrentDocument);
	var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
	menu.addMenuItem(COMMAND_ID, [{key: "Ctrl-Shift-A", platform: "win"},
                                  {key: "Ctrl-Shift-A", platform: "mac"}], Menus.AFTER, Commands.FILE_SAVE);

    // Turn ourself on if we've been turned on in another session
    if(_pStore.getValue("enabled")) _handleEnableBracketLess();
    

});