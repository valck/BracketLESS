BracketLESS
===========

An 'on save' LESS compiler extension for Adobe Brackets.

Installation
============

1. Find your extensions folder by going to "Help -> Show Extensions Folder"
2. Extract the .zip to your Brackets extension directory

Usage
=====

After installing BracketLESS as outlined above, you can use the extension using
either of the methods below:

**Enable auto-parsing of LESS files to CSS**

BracketLESS can automatically parse and save LESS files to CSS when you save them. 
To enable this navigate to the 'View' menu from the top menu bar and select 
'Auto-parse LESS to CSS', now everytime you save a LESS file BracketLESS will parse 
the it and save the ouput within a CSS file of the same name in the same directory.

**Manual parsing**

You can also use the 'Save as LESS' option on the file menu or the keyboard 
shortcut 'CTRL + Shift + S' to parse and save the current file as LESS. 
This will still work even with auto-parsing disabled and will save the ouput 
within a CSS file of the same name in the same directory as the current LESS file.

Road Map
========

* Tests, tests, tests v2.0.1
* Refactor & dialogue system to allow toggling of components (love text, minification, etc)  v2.1
* Better directory structure (issue #4) v2.1

Change Log
==========

**Version 2**

04-07-2013 - 2.0
* BracketLESS now uses a node.js process for parsing LESS files & uses an independent local version of LESS to Brackets
* Improved error reporting including line number & file name
* Full support for @import has now been added (fixes issue #2)
* Added command 'Save as LESS' on the file menu & 'CTRL + Shift + S' as a keyboard shortcut (this still works with BracketLESS disabled)
* Renamed the view menu option from 'Enable BracketLESS' to 'Auto-parse LESS to CSS'.
* Added save success notifications & added icons, lowered default notification timeout
* Added update notifications

**Version 1**

11-04-2013 - 1.2
* Fix: Sprint 23 toolbar update (issue #2)

08-01-2013 - 1.1
* Fix: Parser exception handling update

02-12-2012 - 1.0
* Initial release