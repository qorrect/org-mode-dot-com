
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
                await DAO.put(Strings.DefaultFiles._YMACS, '// Arguments are (ymacs, buffer) \n// ymacs = the running top level application see (docs)\n// buffer = the (.ymacs) buffer  \n// This line overrides the font your set in the Options menu\n// ymacs.getActiveFrame().setStyle({fontFamily: \'Ubuntu Mono\',fontSize: \'25px\'});\n');
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

        } catch (ex) {
            console.log(ex);
        }
        DynarchDomUtils.trash(document.getElementById('x-loading'));

    }
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