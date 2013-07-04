BracketLESS
===========

An 'on save' LESS compiler extension for Adobe Brackets.

Installation
============

1. Find your extensions folder by going to "Help -> Show Extensions Folder"
2. Extract the .zip to your Brackets extension directory
3. Start Brackets and enable the extension from the 'View' menu
4. Create a new LESS file, add some LESS code and save...
5. Voilà, you will see a CSS file of the same name in the  same directory

Usage
=====

After enabling BracketLESS as outlined above, the extension will try and 
parse any .less file when saved and output an identically named CSS file 
within the same directory.

Road Map
========

* Refactor & dialogue system to allow toggling of components (love text, minification, etc)  v2.1
* Better directory structure (issue #4) v2.2

Change Log
==========

**Version 2**

04-07-2013 - 2.0
* BracketLESS now uses a node.js process for parsing LESS files & uses an independent local version of LESS to Brackets
* Improved error reporting including line number & file name
* Full support for @import has now been added (fixes issue #2)
* Upgraded to use LESS 1.3.3

**Version 1**

11-04-2013 - 1.2
* Fix: Sprint 23 toolbar update (issue #2)

08-01-2013 - 1.1
* Fix: Parser exception handling update

02-12-2012 - 1.0
* Initial release