class Application {

    async main() {

        try {

            const ymacs = window.ymacs = new Ymacs();
            ymacs.setColorTheme(['dark', 'y']);

            const mainMenu = new DlHMenu({});
            mainMenu.setStyle({marginLeft: 0, marginRight: 0});
            const dlg = new DlDialog({title: 'Ymacs', resizable: false, className: Strings.APP_WINDOW_ID});

            const today = await DAO.get(Strings.DefaultFiles.TODAY_ORG);
            if (!today) {
                await DAO.put(Strings.DefaultFiles.TODAY_ORG, '* Today \n' +
                    '** Work\n' +
                    '    - [ ] Automation\n' +
                    '    - [ ] Tickets\n' +
                    '** Groceries\n' +
                    '    - [ ] Buy milk\n' +
                    '    - [ ] Fresh dill \n' +
                    '    - [ ] Cholula \n'
                );
            }
            await ymacs.createOrOpen(Strings.DefaultFiles.TODAY_ORG, true);

            const dotYmacsContent = await DAO.get(Strings.DefaultFiles._YMACS);
            if (!dotYmacsContent) {
                await DAO.put(Strings.DefaultFiles._YMACS, '// Arguments are (ymacs, buffer) \n// ymacs = the running top level application see (docs)\n// buffer = the (.ymacs) buffer  \n// This line overrides the font you set in the Options menu\n// ymacs.getActiveFrame().setStyle({fontFamily: \'Ubuntu Mono\',fontSize: \'14px\'});\n');
            }

            const dotYmacs = await ymacs.createOrOpen(Strings.DefaultFiles._YMACS, true);
            dotYmacs.cmd('javascript_mode');

            const layout = new DlLayout({parent: dlg});


            const FileMenuItem = new DlMenuItem({parent: mainMenu, label: 'File'.makeLabel()});

            const fileSubmenu = new DlVMenu({});
            const newFileItem = new DlMenuItem({parent: fileSubmenu, label: '[+] New File'.makeLabel()});
            newFileItem.addEventListener('onSelect', () => {
                ymacs.getActiveBuffer().cmd('execute_extended_command', 'find_file');
            });
            const helpItem = new DlMenuItem({parent: fileSubmenu, label: '[?] Help'.makeLabel()});
            helpItem.addEventListener('onSelect', () => {
                ymacs.getActiveBuffer().cmd('execute_extended_command', 'show_help');
            });
            //
            // const ymacsFilelist = await DAO.get(Strings.Defs.FILE_LIST, []);
            // ymacsFilelist.forEach(async file => {
            //     if (file) {
            //         const buffer = new Ymacs_Buffer({name: file});
            //         const bufferContent = await DAO.get(file);
            //         if (bufferContent) {
            //             buffer.setCode(bufferContent);
            //         }
            //         buffer.maybeSetMode(file);
            //
            //         const menuItem = new DlMenuItem({parent: submenu, label: file.makeLabel()});
            //         menuItem.addEventListener('onSelect', async () => {
            //             await ymacs.createOrOpen(file);
            //         });
            //     }
            // });


            // const files = localStorage.getItem('files');
            //
            // const todayItem = new DlMenuItem({parent: submenu, label: 'today.org'.makeLabel()});
            // todayItem.addEventListener('onSelect', async () => {
            //     const file = 'today.org';
            //     const buffer = ymacs.getBuffer(file);
            //     if (buffer) {
            //         ymacs.switchToBuffer(buffer);
            //     } else {
            //         const newBuffer = ymacs.createBuffer({name: file});
            //         newBuffer.setCode(await DAO.get(file) || '');
            //         newBuffer.cmd('org_mode');
            //         ymacs.switchToBuffer(newBuffer);
            //
            //     }
            //
            //
            // });

            FileMenuItem.setMenu(fileSubmenu);


            fileSubmenu.addSeparator();
            const ymacsSourceItem = new DlMenuItem({parent: fileSubmenu, label: '[.] Ymacs Source'.makeLabel()});


            const ymacsSourceItemsubmenu = new DlVMenu({});

            const files = [
                'ymacs.js',
                'ymacs-keyboard.js',
                'ymacs-regexp.js',
                'ymacs-frame.js',
                'ymacs-textprop.js',
                'ymacs-exception.js',
                'ymacs-interactive.js',
                'ymacs-buffer.js',
                'ymacs-marker.js',
                'ymacs-commands.js',
                'ymacs-commands-utils.js',
                'ymacs-keymap.js',
                'ymacs-keymap-emacs.js',
                'ymacs-keymap-isearch.js',
                'ymacs-minibuffer.js',
                'ymacs-tokenizer.js',
                'ymacs-mode-paren-match.js',
                'ymacs-mode-lisp.js',
                'ymacs-mode-js.js',
                'ymacs-mode-org.js',
                'ymacs-mode-xml.js',
                'ymacs-mode-css.js',
                'ymacs-mode-markdown.js',
                '../../app.js'
            ];
            files.foreach((file) => {
                const item = new DlMenuItem({label: getMenuIcon(file) + file, parent: ymacsSourceItemsubmenu});
                item.addEventListener('onSelect', () => {
                    const request = new DlRPC({url: YMACS_SRC_PATH + file + '?killCache=' + new Date().getTime()});
                    request.call({
                        callback(data) {
                            const code = data.text.replace(/\r\n/g, '\n');
                            const buf = ymacs.getBuffer(file) || ymacs.createBuffer({name: file});
                            buf.setCode(code);
                            buf.cmd('javascript_dl_mode', true);
                            ymacs.switchToBuffer(buf);
                        }
                    });
                });
            });
            const dotYmacsItem = new DlMenuItem({parent: fileSubmenu, label: '[~] .ymacs'.makeLabel()});
            dotYmacsItem.addEventListener('onSelect', () => {
                const file = '.ymacs';
                const buffer = ymacs.getBuffer(file);
                if (buffer) {
                    ymacs.switchToBuffer(buffer);
                } else {
                    const newBuffer = ymacs.createBuffer({name: file});
                    newBuffer.setCode(DAO.get(file) || []);
                }

            });
            ymacsSourceItem.setMenu(ymacsSourceItemsubmenu);
            mainMenu.addFiller();

            const optionsMenu = new DlMenuItem({parent: mainMenu, label: 'Options'.makeLabel()});

            const optionsSubmenu = new DlVMenu({});
            optionsMenu.setMenu(optionsSubmenu);

            const indentLevelItem = new DlMenuItem({
                parent: optionsSubmenu,
                label: 'Set indentation level'.makeLabel()
            });
            indentLevelItem.addEventListener('onSelect', () => {
                const buf = ymacs.getActiveBuffer();
                let newIndent = prompt('Indentation level for the current buffer: ', buf.getq('indent_level'));
                if (newIndent !== null)
                    newIndent = parseInt(newIndent, 10);
                if (newIndent !== null && !isNaN(newIndent)) {
                    buf.setq('indent_level', newIndent);
                    buf.signalInfo('Done setting indentation level to ' + newIndent);
                }
            });


            const toggleLineMenuItem = new DlMenuItem({
                parent: optionsSubmenu,
                label: 'Toggle line numbers'.makeLabel()
            });
            toggleLineMenuItem.addEventListener('onSelect', () => {
                ymacs.getActiveBuffer().cmd('toggle_line_numbers');
            });

            /* -----[ color theme ]----- */

            const colorThemesMenuItem = new DlMenuItem({parent: optionsSubmenu, label: 'Color theme'.makeLabel()});
            const colorThemesubmenu = new DlVMenu({});
            colorThemesMenuItem.setMenu(colorThemesubmenu);

            [
                'dark|y|Reset to default',
                'dark|mishoo|>Mishoo\'s Emacs theme',
                'dark|billw|>Billw',
                'dark|charcoal-black|>Charcoal black',
                'dark|clarity-and-beauty|>Clarity and beauty',
                'dark|classic|>Classic',
                'dark|gnome2|>Gnome 2',
                'dark|calm-forest|>Calm forest',
                'dark|linh-dang-dark|>Linh Dang Dark',
                'dark|blue-mood|>Blue mood',
                'dark|zenburn|>Zenburn',
                'dark|standard-dark|>Emacs standard (dark)',
                null,
                'light|y|Light background (default)',
                'light|andreas|>Andreas',
                'light|bharadwaj|>Bharadwaj',
                'light|gtk-ide|>GTK IDE',
                'light|high-contrast|>High contrast',
                'light|scintilla|>Scintilla',
                'light|standard-xemacs|>Standard XEmacs',
                'light|vim-colors|>Vim colors',
                'light|standard|>Emacs standard (light)'
            ].foreach((_theme) => {
                if (_theme === null) {
                    colorThemesubmenu.addSeparator();
                } else {
                    const theme = _theme.split(/\s*\|\s*/);
                    let label = theme.pop();
                    label = label.replace(/^>\s*/, '&nbsp;'.x(4));
                    const item = new DlMenuItem({parent: colorThemesubmenu, label});
                    item.addEventListener('onSelect', ymacs.setColorTheme.$(ymacs, theme));
                }
            });

            /* -----[ font ]----- */

            const fontFamilyMenuItem = new DlMenuItem({parent: optionsSubmenu, label: 'Font family'.makeLabel()});
            const fontFamilyMenuItemsubmenu = new DlVMenu({});
            fontFamilyMenuItem.setMenu(fontFamilyMenuItemsubmenu);

            const fontFamilyMenuitem = new DlMenuItem({parent: fontFamilyMenuItemsubmenu, label: 'Reset to default'});
            fontFamilyMenuitem.addEventListener('onSelect', async () => {
                await DAO.del(Strings.CONFIG.FONT_FAMILY);
                ymacs.getActiveFrame().setStyle({fontFamily: ''});
            });

            fontFamilyMenuItemsubmenu.addSeparator();

            [
                'Andale Mono',
                'Courier New',
                'Inconsolata',
                'Source Code Pro',
                'B612 Mono',
                'Ubuntu Mono',
                'Nanum Gothic Coding',
                'Fira Mono',
                'Cousine',
                'Oxygen Mono',
                'IBM Plex Mono',
                'Roboto Mono',
                'Nova Mono',
                'Share Tech Mono',
                'Overpass Mono',
                'Major Mono Display'

            ].foreach((font) => {
                const item = new DlMenuItem({
                    parent: fontFamilyMenuItemsubmenu,
                    label: '<span style=\'font-family:' + font + '\'>' + font + '</span>'
                });
                item.addEventListener('onSelect', () => {
                    DAO.put(Strings.CONFIG.FONT_FAMILY, font);
                    ymacs.getActiveFrame().setStyle({fontFamily: font});
                });
            });

            // ymacs.getActiveFrame().setStyle({ fontFamily: "Arial", fontSize: "18px" });

            /* -----[ font size ]----- */

            const fontSizeMenuitem = new DlMenuItem({parent: optionsSubmenu, label: 'Font size'.makeLabel()});
            const fontSizeMenuitemsubmenu = new DlVMenu({});
            fontSizeMenuitem.setMenu(fontSizeMenuitemsubmenu);

            const fontMenuitem = new DlMenuItem({parent: fontSizeMenuitemsubmenu, label: 'Reset to theme'});
            fontMenuitem.addEventListener('onSelect', () => {
                DAO.put(Strings.CONFIG.FONT_SIZE, '');
                ymacs.getActiveFrame().setStyle({fontSize: ''});
            });

            fontSizeMenuitemsubmenu.addSeparator();

            [
                '11px',
                '12px',
                '14px',
                '16px',
                '18px',
                '20px',
                '22px',
                '24px'

            ].foreach((font) => {
                const item = new DlMenuItem({
                    parent: fontSizeMenuitemsubmenu,
                    label: '<span style=\'font-size:' + font + '\'>' + font + '</span>'
                });
                item.addEventListener('onSelect', () => {
                    DAO.put(Strings.CONFIG.FONT_SIZE, font);
                    ymacs.getActiveFrame().setStyle({fontSize: font});
                });
            });


            const aboutMenuitem = new DlMenuItem({parent: optionsSubmenu, label: 'About'});
            aboutMenuitem.addEventListener('onSelect', () => {
                alert('About org-mode online.');
            });

            layout.packWidget(mainMenu, {pos: 'top'});
            layout.packWidget(ymacs, {pos: 'bottom', fill: '*'});

            dlg._focusedWidget = ymacs;
            dlg.setSize({x: 800, y: 600});

            // show two frames initially
            // ymacs.getActiveFrame().hsplit();
            const fontSize = (await DAO.get(Strings.CONFIG.FONT_SIZE)) || '25px';
            ymacs.getActiveFrame().setStyle({fontSize});
            const fontFamily = (await DAO.get(Strings.CONFIG.FONT_FAMILY)) || 'Ubuntu Mono';
            ymacs.getActiveFrame().setStyle({fontFamily});

            evaluateJavascript.call(this, dotYmacsContent, [dotYmacs, ymacs]);
            dlg.show(true);

            try {
                // dlg.setPos(0,0);
                // dlg.makeResizable();
                dlg.maximize(true);
                // eslint-disable-next-line no-empty
            } catch (e) {
                if (e.toString().indexOf('__maxBtn.checked is not a function') === -1)
                    console.log(e);
            }

            FileDAO.refresh().then(fileTree => {
                console.log('HERE IN DROPBOX GOT FILES !!');
                console.dir(fileTree);
                if (fileTree.children && fileTree.children.length) {
                    fileSubmenu.addSeparator();
                    addDropboxSource(fileTree, fileSubmenu);
                } else {
                    fileSubmenu.addSeparator();
                    new DlMenuItem({parent: fileSubmenu, label: 'Dropbox'});

                }

            });


        } catch (ex) {
            console.log(ex);
        }
        DynarchDomUtils.trash(document.getElementById('x-loading'));

    }
}

function getMenuIcon(path) {
    const idx = path.lastIndexOf('.'),
        fileIdx = path.lastIndexOf('/'),
        fileName = path.substr(fileIdx + 1),
        suffix = path.substr(idx + 1);
    if (path.substring(path.length - 1) === '~') {
        return '<span style="color: slategray;font-size: 1em" class="devicons devicons-gnu"></span> ';
    } else if (suffix === 'js') {
        if (fileName.toLowerCase() === 'app.js' ||
            fileName.toLowerCase() === 'index.js') {
            return '<span style="color: darkgreen;" class="devicons devicons-nodejs_small"></span> ';
        } else if (fileName === 'gulpfile.js') {
            return '<span style="color: #4e4e4e" class="devicons devicons-gulp"></span> ';
        } else if (fileName.toLowerCase() === 'gruntfile.js') {
            return '<span style="color: #4e4e4e" class="devicons devicon-grunt-line"></span> ';
        } else return '<i style="color: rgba(233,121,29,0.92);font-size: .9em" class="devicons devicons-javascript_badge"></i> ';
    } else if (suffix === 'css' || suffix === 'scss') {
        return '<span style="color: skyblue" class="devicons devicons-css3_full"></span> ';
    } else if (suffix === 'html') {
        return '<span style="color: gold" class="devicons devicons-html5"></span> ';
    } else if (suffix === 'sh') {
        return '<span style="color: lightslategray" class="devicons devicons-terminal_badge"></span> ';
    } else if (suffix === 'org') {
        return '<i class="fas fa-sitemap" style="font-size: .8em;color: lightgray"></i> ';
    } else if (suffix === 'ps1') {
        return '<span style="color: steelblue" class="devicons devicons-windows"></span> ';
    } else if (suffix === 'json') {
        if (fileName.toLowerCase() === 'bower.json') {
            return '<span style="background-color: yellow;color: #543729" class="devicons devicons-bower"></span> ';
        } else if (fileName.toLowerCase() === 'package.json' || fileName.toLowerCase() === 'package-lock.json') {
            return '<span style="color: darkred" class="devicons devicons-npm"></span> ';
        }
        return '<span style="color: steelblue" class="devicons devicons-javascript"></span> ';
    } else if (suffix === 'md') {
        return '<i class="fab fa-markdown" style="font-size: .8em;"></i> ';
    } else if (suffix === 'org') {
        return '<i class="fas fa-sitemap" style="font-size: .9em;color: lightgray"></i> ';
    } else if (fileName.startsWith('.') || suffix === 'log' || suffix === 'conf' || suffix === 'cfg') {
        return '<i class="far fa-file-alt" style="font-size: .9em;color: lightgray"></i> ';
    } else if (suffix === 'xml' || suffix === 'xsl' || suffix === 'iml' || suffix === 'xslt') {
        return '<i class="fas fa-code" style="font-size: .9em;color: darkslategrey"></i> ';
    } else if (suffix === 'ico' || suffix === 'png' || suffix === 'jpg' || suffix === 'jpeg') {
        return '<i class="far fa-image" style="font-size: .9em;color: darkslategrey"></i> ';
    } else if (suffix === 'py' || suffix === 'pyc') {
        return '<span style="color: steelblue" class="devicons devicons-python"></span> ';

    } else if (suffix === 'java' || suffix === 'javac') {
        return '<span style="color: #5181a0;" class="devicons devicon-java-plain"></span> ';

    } else if (suffix === 'php' || suffix === 'phar') {
        return '<span style="color: #4e4e4e" class="devicons devicons-php"></span> ';
    } else if (fileName.toLowerCase() === 'jenkinsfile') {
        return '<span style="background-color: black;color: white;" class="devicons devicons-jenkins"></span> ';
    } else if (fileName.toLowerCase() === 'dockerfile') {
        return '<span style="color: #099cec" class="devicons devicons-docker"></span> ';
    } else if (suffix === 'clojure') {
        return '<span style="color: #099cec" class="devicons devicons-clojure_alt"></span> ';
    } else return '<span class="far fa-file" style="font-size: 1.2em;"> </span> ';
}

function addDropboxSource(fileeTree, parent, menuLabel = '[D] Dropbox') {
    const toplevel = new DlMenuItem({parent, label: menuLabel});
    const submenu = new DlVMenu({});

    if (fileeTree.children) {
        fileeTree.children.forEach(child => {
            let str = child.name.toString().replace(/ /g, '&nbsp;');
            if (child.type === Strings.Types.FOLDER) {
                str = '<i class="far fa-folder" style="font-size: 1.2em;color: darkgoldenrod;"></i> ' + str + '/';
                addDropboxSource(child, submenu, str);
            } else {
                const item = new DlMenuItem({parent: submenu, label: getMenuIcon(child.path) + str});
                item.addEventListener('onSelect', () => {
                    ymacs.createOrOpen(child.path);
                });
            }
        });
    }
    toplevel.setMenu(submenu);

}

function _addDropboxSource(fileeTree, parent) {

}

// Expects to be called like evaluateJavascript.call(buffer / this , arguments)
// TODO:  Put this somewhere
function evaluateJavascript(code_string, variables) {
    try {
        const code = new Function('buffer', 'ymacs', code_string);
        const ret = code.apply(this, variables);
        console.log(ret);

    } catch (ex) {
        console.log(ex);
    }
}


const app = new Application();
app.main().then(() => console.log('finished'));
