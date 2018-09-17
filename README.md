# Cryptonite Browser Extension

Cryptonite is a browser extension (add-on) designed to protect users from malicious attacks and phishing scams through the use of the extension's visual indicator, the Cryptonite shield.

When the shield turns green, users can be confident the website they're visiting is a trusted resource verified by MetaCert. When users visit a malicious or phishing URL, it directs them to a block page with a warning that they're about to visit a known malicious resource.

Cryptonite is powered by the [MetaCert Protocol](https://metacertprotocol.com), one of the world's largest threat intelligence databases. Cryptonite is available for Google Chrome, Mozilla Firefox and Opera.

# How to install the add-on

1. You can either download the project files as a ZIP file or check the project files.
2. Open your browser and load the files into the browser as an unpacked extension:
  - On Chrome: go to `chrome://extensions/` select the option `LOAD UNPACKED` and then select the `src` folder from the project
  - On Opera: go to `about://extensions`  select the option `Load Unpacked Extension` and then select the `src` folder from the project
  - On Firefox: go to `about:debugging#addons` select the option `Load Temporary Addon...` and then select the `manifest.json` file from inside the `src` folder from the project

3. The add-on should be installed in your browser and ready to be used.

# How to debug the add-on

There are two ways to debug the add-on:
- Add `console.log("Your message", yourObject);` anywhere in the project where you want to debug messages
- Search for the line `this.debugActive = false;` and change it to `this.debugActive = true;`. Then add `cryptonite.debug("Your message", yourObject);` anywhere in the project where you want to debug messages

# How to use the `jslint` features on the Cryptonite code

There are several ways to scan the Javascript files in the project with jslint:

1. From the command-line, execute:
```sh
$ grunt jslint
```
This will result in a file called *grunt-jslint-results.log* in the *output* folder.
When calling this command, you are using the grunt package called `grunt-jslint`.
All the configuration for this grunt call is inside the file *Gruntfile.js* in the `jslint` config section.

2. From the command-line, execute:
```sh
$ grunt cryptonite-jslint
```
This will result in a file called *jslint-results.log* in the *output* folder.

  If you execute:
```sh
$ grunt cryptonite-jslint --c
```
the results will be displayed on the console instead of a log file.

  When calling the `grunt cryptonite-jslint` command you are using the `jslint` command-line feature from the node package, which is called inside a grunt wrapper. The configuration for the `grunt cryptonite-jslint` command is inside a file called *jslint.conf*

3. From the command-line, execute:
```sh
$ jslint 'path/to/your/file' > output/results.log
```
This will result in a file called *results.log* in the *output* folder.
If you call `jslint` directly, you can scan a single file or a set of files. For example:
```sh
$ jslint 'src/js/**/*.js' > output/results.log
```
will scan **all the files in the project**, and
```sh
$ jslint 'src/js/background/background.js' > output/results.log
```
will scan the background.js file only.

  If you want the results in the console instead of a log file, you can call something like:
```sh
$ jslint --color 'src/js/background/background.js'
```
When calling the `jslint` command you are using the `jslint` command-line feature from the node package directly. The configuration for this `jslint` command is inside a file called *jslint.conf*.

# How to generate the `jsodc` documentation on the Cryptonite code

To generate the `jsodc` documentation on the Cryptonite code, you need execute the following command:
```sh
$ grunt jsdoc
```
a folder called *output/doc* will be created. This folder will contain all the generated documentation.

# How to create or update the wiki information from the `jsodc` documentation on the Cryptonite code

From the command-line, execute:
```sh
$ jsdoc2md 'src/js/**/*.js' > output/wiki.md
```
a file with all the wiki information will be generated in the *output* folder. You need to copy-and-paste the contents of this file to the wiki page on the repository.

# How to syncronise the `internal-cryptonite` and the `cryptonite` repositories

1. Make sure you have a working folder with two repositories: `internal-cryptonite`: https://github.com/metacert/internal-cryptonite and `cryptonite`: https://github.com/metacert/cryptonite
2. Make sure both folders `internal-cryptonite` and `cryptonite` are at the same level
3. Go to the `cryptonite` folder on your local machine and set `develop` as your current working branch
4. Pull the latest changes from the `develop` branch into the `cryptonite` folder
5. Go to the `internal-cryptonite` folder on your local machine and set `develop` as your current working branch
6. Pull the latest changes from the `develop` branch into the `internal-cryptonite` folder
7. From the command-line, execute:
```sh
$ grunt update-repo
```
This command will copy all the files from the `internal-cryptonite` folder to the `cryptonite` folder. This command will also remove all the sensitive information from the `cryptonite` folder, like the keys to call the MetaCert API
8. On the `cryptonite` repository, commit all the changes inside the `cryptonite` folder. Make sure you are committing the changes into the `develop` branch
9. On the `cryptonite` repository, merge your changes from the `develop` branch into the master `branch`
