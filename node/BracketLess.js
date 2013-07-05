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
    
    var less = require('less.js-1.3.3'),
		xml2js = require('node-xml2js-0.2.8'),
		https     = require("https");
	
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
	 * Implements "checkForUpdate" command, asynchronously.
	 */
	function cmdCheckForUpdate(url, currentVersionID, cb) {
			
			console.log('[bracketless] checking ' + url + ' for update');
			
			_getAtomFeed(url, function (feedResponse) {
			
				if(feedResponse.error != null) {
					cb({error: feedResponse.error, update: false});
				} else {
					
					_parseXML(feedResponse.xml, function (xmlResponse) {
					
						if(xmlResponse.error != null) {
							cb({error: xmlResponse.error, version: false});
						} else {
							cb({error: xmlResponse.error, version: xmlResponse.version});
						}
					
					});
				}
			
			});
		
	}
	
	function _getAtomFeed(url, cb) {
	
		var req = https.get(url, function (res) {
		
		
				if (res.statusCode !== 200) {
					cb({error: res.statusCode, xml: null});
					return;
				}
				
				res.on('data', function(d) {			
					cb({error: null, xml: d.toString()});
				});
				
			}).on('error', function(e) { 
				cb({error: e, xml: null});
			});
	}
	
	function _parseXML(xml, cb) {
	
		var parser = new xml2js.Parser();
		parser.parseString(xml, function (err, result) {
				
			var version, fUrl, rUrl, entry, readableVersion;
			if(typeof result.feed === 'object'
				&& typeof result.feed.entry === 'object') {				
					
					entry = result.feed.entry[0];				
					version = entry.id[0];
					readableVersion = entry.id.toString().split('/').pop();
					fUrl = 'https://github.com' + entry.link[0]['$'].href.toString().replace('releases', 'archive') + '.zip';
					rUrl = 'https://github.com' + entry.link[0]['$'].href.toString();
					
					
			} else {
				err = "Invalid feed response.";
			}
		
			cb({error: err, version: { current: version, readable: readableVersion, releaseUrl: rUrl, fileUrl: fUrl } });
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
		
		//cmdCheckForUpdate

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
		
		domainManager.registerCommand(
            "bracketless",       // domain name
            "checkForUpdate",    // command name
            cmdCheckForUpdate,   // command handler function
            true,          // this command is synchronous
            "Returns the total and free memory on the user's system in bytes",
            [{
                name: "url",
                type: "string",
                description: "git hub release atom url"
            },
			{
                name: "currentVersionID",
                type: "string",
                description: "git hub release ID"
            }],
			[{
                name: "cb",
                type: "{error: object, version: object}",
                description: "callback on processing completion"
            }]
        );
    }
    
    exports.init = init;
    
}());