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
    
    var FileUtils	      = brackets.getModule("file/FileUtils"),
        NativeFileSystem    = brackets.getModule("file/NativeFileSystem").NativeFileSystem;    
	
    var love_insertion = "/* This beautiful CSS-File has been crafted with LESS (lesscss.org) and compiled by bracketLESS (codeblog.co.uk/bracketless) */";
	
	var LessParser = {
        
        options: { 
            removeLineEndings: false, 
            removeExcessWhitespace: false, 
            removeCSSComments: false, 
            insertLoveMessage: false 
        },

		/**
		 * Reads a file and attempts to parse and compile the less code.
		 * @param {!FileEntry} fileEntry
         * @param {string} CSS output file path
		 * @return {$.Promise} a jQuery promise that will be resolved when
		 * parsing & compliation completes with CSS code & FileEntry (if 
         * outputPath is specified), or rejected with a ParserError.
		 */
		parseLessFile: function (file, outputPath) {	
            
			var parserPromise 	= new $.Deferred(),
				fExt = file.name.split(".").pop();		
			
			if(fExt === "less") {		
				FileUtils.readAsText(file).done(function(text, time) {				
					LessParser.parseLessCode(text)
                        .done(function(cssCode) {                            
                            if(outputPath != null) {                                
                                LessParser.writeCSSFile(cssCode, outputPath)
                                    .done(function(fileEntry) { parserPromise.resolve({cssCode: cssCode, outputFile: fileEntry}); })
                                    .fail(function(err){ parserPromise.reject(err); });                                
                            } else {
                                parserPromise.resolve({cssCode: cssCode, outputFile: null}); 
                            }                            
                        })
                        .fail(function(err) { parserPromise.reject(err); });					
				}).fail(function(err){				
					parserPromise.reject(new LessParser.ParserError(err));				
				});
			} else {
	   			parserPromise.reject(new LessParser.ParserError("The file supplied was missing the LESS file extension. (.less)"));
	   		}
				
			return parserPromise.promise();
				
		},
		
		/**
		 * Attempts to parse LESS code
		 * @param {!string} lessCode
		 * @return {$.Promise} a jQuery promise that will be resolved when
		 * code parsing completes
		 */
		parseLessCode: function (lessCode) {
		
			try {
		
			var parser 			= new less.Parser(),
				parserPromise 	= new $.Deferred();
					
			parser.parse(lessCode, function (err, tree) {					
				if(err) {					 
					parserPromise.reject(new LessParser.ParserError(err));
				} else {
					var cssCode = tree.toCSS();                                        
                    if(LessParser.options.removeLineEndings == true) cssCode = LessParser.removeLineEndings(cssCode);
                    if(LessParser.options.removeCSSComments == true) cssCode = LessParser.removeCSSComments(cssCode);
                    if(LessParser.options.removeExcessWhitespace == true) cssCode = LessParser.removeExcessWhitespace(cssCode);
					parserPromise.resolve(cssCode);
				}					 
			});
			
			} catch(ex) {
			
				var msg = '';
			
				if(ex.message == '') {
					msg = 'There was an unknown error processing the LESS file, check that all variables exist and try again.';
				} else {
					msg = ex.message;
				}
				parserPromise.reject(new LessParser.ParserError(msg));
			}
			
			return parserPromise.promise();
			
		},
        
        removeLineEndings: function (cssCode) {
            var findAnyEol = /\r\n|\r|\n/g;
            return cssCode.replace(findAnyEol, "");      
        },
        
        removeExcessWhitespace: function(cssCode) {          
            return cssCode.replace(/\s+/g, " ");            
        },
        
        removeCSSComments: function(cssCode) {          
            return cssCode.replace(/(\/\*)([^\/\*\/]?)+(\*\/)/g, "");            
        },
        
        /**
         * Writes a file to disk
         * @param {!string} CSS Code
         * @param {!string} output path
         * @return {$.Promise} a jQuery promise that will be resolved when
         * the file has been written
         */	
        writeCSSFile: function(code, outputPath) {            
         
            var result 	= new $.Deferred(),
                fileEntry = new NativeFileSystem.FileEntry(outputPath),
                lineEnding = "\n";
            
            if(FileUtils.getPlatformLineEndings() === "CRLF") lineEnding = "\r\n"
            
            if(love_insertion != undefined && LessParser.options.insertLoveMessage) code = love_insertion + lineEnding + code;
            
             FileUtils.writeText(fileEntry, code)
                 .done(function(){result.resolve(fileEntry);})
                 .fail(function(err){result.reject(new LessParser.ParserError(err));});
            
            return result.promise();
            
        }
	
	}
        
	/**
     * Wrapper for errors
	 * @param {!FileError|!LessError} err
	 * @return {!ParserError} a PaserError with public error
	 * type and string set.
	 */	
	LessParser.ParserError = function(err) {
	
		var FILE_ERROR = 1,
			LESS_PARSER_ERROR = 2,
			UNKNOWN_ERROR = 0;
        
        var _type = 0, _text = "";
		
		function _setErrorFromObject(obj) {
		
			var objType = Object.prototype.toString.call(obj);
            
            if(objType === "[object Object]") {                
                if(obj.type != undefined) { 
                    _setError(LESS_PARSER_ERROR, obj.message);
                    return;
                } else if(obj.code != undefined) {
                    _setError(FILE_ERROR, FileUtils.getFileErrorString(obj.code));
                    return;
                }
            } else if(objType === "[object String]") {                 
                _setError(UNKNOWN_ERROR, obj);  
                return;
            }
            
           _setError(UNKNOWN_ERROR, "An unknown error occured.");          
			
		}
        
        function _setError(type, text) {         
            _type = type;
            _text = text;            
        }
		
		_setErrorFromObject(err);
		this.Type = _type;
        this.Text = _text;
	}
	
	/* Our exports */
	exports.LessParser = LessParser;
		
});