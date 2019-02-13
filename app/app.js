
class Application {

    async main() {

        try {


            const mainMenu = new DlHMenu({});
            mainMenu.setStyle({marginLeft: 0, marginRight: 0});
            const dlg = new DlDialog({title: 'Ymacs', resizable: false});

            const markdown = new Ymacs_Buffer({name: 'today.org'});
            const markdownContents = await DAO.get('today.org');
            if (markdownContents) markdown.setCode(markdownContents);
            else {
                markdown.setCode(
                    '* Today \n' +
                    '** Work\n' +
                    '    - [ ] Automation\n' +
                    '    - [ ] Tickets\n' +
                    '*** Next Sprint \n' +
                    '    - [ ] Replace all truthys with falsys\n' +
                    '** Groceries\n' +
                    '    - [ ] Buy milk\n' +
                    '    - [ ] Fresh dill \n'
                )
                ;
            }
            markdown.cmd('org_mode');
            // markdown.cmd("paren_match_mode");

            const keys = new Ymacs_Buffer({name: '.ymacs'});
            let ymacsContents = await DAO.get('.ymacs');
            if (!ymacsContents) {
                ymacsContents = '// Arguments are (ymacs, buffer) \n// ymacs = the running top level application see (docs)\n// buffer = the (.ymacs) buffer  \n// This line overrides the font your set in the Options menu\n// ymacs.getActiveFrame().setStyle({fontFamily: \'Ubuntu Mono\',fontSize: \'25px\'});\n';
            }
            keys.setCode(ymacsContents);

            // keys.setCode('testing');
            keys.cmd('javascript_mode');

            const layout = new DlLayout({parent: dlg});

            const ymacs = window.ymacs = new Ymacs({buffers: [markdown, keys]});
            ymacs.setColorTheme(['dark', 'y']);


            const yourFilesMenuItem = new DlMenuItem({parent: mainMenu, label: 'Your Files'.makeLabel()});

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
                '../app.js'
            ];
            const submenu = new DlVMenu({});
            const newFileItem = new DlMenuItem({parent: submenu, label: '[+] New File'.makeLabel()});
            newFileItem.addEventListener('onSelect', () => {
                ymacs.getActiveBuffer().cmd('execute_extended_command', 'find_file');
            });

            let ymacsFilelist = (await DAO.get(Keys.FILE_LIST)) || '';
            ymacsFilelist = ymacsFilelist.split(',');
            if (ymacsFilelist) {
                ymacsFilelist = _.isArray(ymacsFilelist) ? ymacsFilelist : [ymacsFilelist];
                ymacsFilelist.forEach(async file => {
                    if (file) {
                        const buffer = new Ymacs_Buffer({name: file});
                        const bufferContent = await DAO.get(file);
                        if (bufferContent) {
                            buffer.setCode(bufferContent);
                        }
                        buffer.maybeSetMode(file);

                        const menuItem = new DlMenuItem({parent: submenu, label: file.makeLabel()});
                        menuItem.addEventListener('onSelect', async () => {
                            await ymacs.createOrOpen(file);
                        });
                    }
                });
            } else {
                await DAO.put(Keys.FILE_LIST, []);
            }


            // const files = localStorage.getItem('files');

            const todayItem = new DlMenuItem({parent: submenu, label: 'today.org'.makeLabel()});
            todayItem.addEventListener('onSelect', async () => {
                const file = 'today.org';
                const buffer = ymacs.getBuffer(file);
                if (buffer) {
                    ymacs.switchToBuffer(buffer);
                } else {
                    const newBuffer = ymacs.createBuffer({name: file});
                    newBuffer.setCode(await DAO.get(file) || '');
                    newBuffer.cmd('org_mode');
                    ymacs.switchToBuffer(newBuffer);

                }


            });
            const dotYmacsItem = new DlMenuItem({parent: submenu, label: '.ymacs'.makeLabel()});
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


            const ymacsSourceItem = new DlMenuItem({parent: submenu, label: 'Ymacs Source'.makeLabel()});

            yourFilesMenuItem.setMenu(submenu);

            const ymacsSourceItemsubmenu = new DlVMenu({});

            files.foreach((file) => {
                const item = new DlMenuItem({label: file, parent: ymacsSourceItemsubmenu});
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
                await DAO.del(Config.FONT_FAMILY);
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
                    DAO.put(Config.FONT_FAMILY, font);
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
                DAO.put(Config.FONT_SIZE, '');
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
                    DAO.put(Config.FONT_SIZE, font);
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
            const fontSize = (await DAO.get(Config.FONT_SIZE)) || '25px';
            ymacs.getActiveFrame().setStyle({fontSize});
            const fontFamily = (await DAO.get(Config.FONT_FAMILY)) || 'Ubuntu Mono';
            ymacs.getActiveFrame().setStyle({fontFamily});


            try {
                const code = new Function('buffer', 'ymacs', ymacsContents);
                const variables = [
                    keys,      // buffer
                    ymacs // ymacs
                ];
                const ret = code.apply(this, variables);
                console.log(ret);

                ymacs.getActiveBuffer().cmd('eval_string', ymacsContents);
            } catch (ex) {
                console.log(ex);
            }


            dlg.show(true);

            try {
                // dlg.setPos(0,0);
                // dlg.makeResizable();
                dlg.maximize(true);
                // eslint-disable-next-line no-empty
            } catch (e) {
            }

        } catch (ex) {
            // console.log(ex);
        }
        DynarchDomUtils.trash(document.getElementById('x-loading'));

    }
}


const app = new Application();
app.main().then(() => console.log('finished'));
