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
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    var less = require('less.js-1.3.3');

	
	 /**
     * @private
     * Handler function for the bracketless.parseLESS commannd
     * @return {{total: number, free: number}} The total and free amount of
     *   memory on the user's system, in bytes.
     */
    function cmdParseLess(lessCode, file, cb) {
	
			var parser = new(less.Parser)({
				paths: [file.fullPath.replace(file.name,'')], // Specify search paths for @import directives
				filename: file.name // Specify a filename, for better error messages
			});
		
			parser.parse(lessCode, function (e, tree) {
				var parsedCSS = "";
				
				try {
					if(typeof tree === 'object') parsedCSS = tree.toCSS({ compress: true });
				} catch(ex) { e = ex; }
				
				cb({css: parsedCSS, error: e});
			});
    }
    
    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} DomainManager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain("bracketless")) {
            domainManager.registerDomain("bracketless", {major: 0, minor: 1});
        }

		domainManager.registerCommand(
            "bracketless",       // domain name
            "parseLess",    // command name
            cmdParseLess,   // command handler function
            true,          // this command is synchronous
            "Returns the total and free memory on the user's system in bytes",
            [{
                name: "lessCode",
                type: "string",
                description: "less code to pass"
            },
			{
                name: "file",
                type: "file",
                description: "file object of the current file"
            }],
			[{
                name: "cb",
                type: "{css: string, errors: object}",
                description: "callback on processing completion"
            }]
        );
    }
    
    exports.init = init;
    
}());