// This has become the org-mode-dot-com app , Charlie Manning Sanders 1/11/2019

// ORIGINAL COMMENTS

/*

  Note that this file is just an example.  It should not be treated as
  part of Ymacs itself.  Ymacs is just an editing platform and as such
  it has no menus, no toolbar etc.  These can be easily added using
  other DynarchLIB widgets, as this file demonstrates.

  If a collection of useful menus/toolbars will emerge, a new compound
  widget will be defined.

*/

var desktop = new DlDesktop({});
desktop.fullScreen();

function print(obj) {
    var a = [], i;
    for (i in obj) {
        var val = obj[i];
        if (val instanceof Function)
            val = val.toString();
        else
            val = DlJSON.encode(val);
        a.push(DlJSON.encode(i) + " : " + val);
    }
    return a.map(function (line) {
        return line.replace(/^/mg, function (s) {
            return "        ";
        });
    }).join("\n");
};


try {
    const dlg = new DlDialog({title: "Ymacs", resizable: false});


    const markdown = new Ymacs_Buffer({name: "today.org"});
    const markdownContents = localStorage.getItem('today.org');
    if (markdownContents) markdown.setCode(markdownContents);
    else {
        markdown.setCode(
            "* Today \n" +
            "** Work\n" +
            "    - [ ] Automation\n" +
            "    - [ ] Tickets\n" +
            "*** Next Sprint \n" +
            "    - [ ] Replace all truthys with falsys\n" +
            "    - [ ] Scriggle that scriz\n" +
            "** Home\n" +
            "    - [ ] Play video games\n" +
            "    - [ ] Exercise\n"
        )
        ;
    }
    markdown.cmd("org_mode");
    // markdown.cmd("paren_match_mode");

    const keys = new Ymacs_Buffer({name: ".ymacs"});
    const ymacsContents = localStorage.getItem('.ymacs');
    if (ymacsContents) keys.setCode(ymacsContents);

    // keys.setCode('testing');
    keys.cmd("javascript_mode");

    const layout = new DlLayout({parent: dlg});

    const empty = new Ymacs_Buffer({name: "empty"});
    const ymacs = window.ymacs = new Ymacs({buffers: [markdown, keys]});
    ymacs.setColorTheme(["dark", "y"]);

    try {
        ymacs.getActiveBuffer().cmd("eval_string", ymacsContents);
    } catch (ex) {
        console.log(ex);
    }

    const mainMenu = new DlHMenu({});
    mainMenu.setStyle({marginLeft: 0, marginRight: 0});

    const yourFilesMenuItem = new DlMenuItem({parent: mainMenu, label: "Your Files".makeLabel()});

    var files = [
        "ymacs.js",
        "ymacs-keyboard.js",
        "ymacs-regexp.js",
        "ymacs-frame.js",
        "ymacs-textprop.js",
        "ymacs-exception.js",
        "ymacs-interactive.js",
        "ymacs-buffer.js",
        "ymacs-marker.js",
        "ymacs-commands.js",
        "ymacs-commands-utils.js",
        "ymacs-keymap.js",
        "ymacs-keymap-emacs.js",
        "ymacs-keymap-isearch.js",
        "ymacs-minibuffer.js",
        "ymacs-tokenizer.js",
        "ymacs-mode-paren-match.js",
        "ymacs-mode-lisp.js",
        "ymacs-mode-js.js",
        "ymacs-mode-org.js",
        "ymacs-mode-xml.js",
        "ymacs-mode-css.js",
        "ymacs-mode-markdown.js",
        "../app.js"
    ];
    const submenu = new DlVMenu({});
    const newFileItem = new DlMenuItem({parent: submenu, label: "[+] New File".makeLabel()});
    newFileItem.addEventListener("onSelect", function () {
        alert('new file');
    });


    // const files = localStorage.getItem('files');

    const todayItem = new DlMenuItem({parent: submenu, label: "today.org".makeLabel()});
    todayItem.addEventListener("onSelect", function () {
        const file = "today.org";
        var buf = ymacs.getBuffer(file) || ymacs.createBuffer({name: file});
        ymacs.switchToBuffer(buf);

    });
    const dotYmacsItem = new DlMenuItem({parent: submenu, label: ".ymacs".makeLabel()});
    dotYmacsItem.addEventListener("onSelect", function () {
        const file = ".ymacs";
        var buf = ymacs.getBuffer(file) || ymacs.createBuffer({name: file});
        ymacs.switchToBuffer(buf);

    });
    const ymacsSourceItem = new DlMenuItem({parent: submenu, label: "Ymacs Source".makeLabel()});

    yourFilesMenuItem.setMenu(submenu);

    const ymacsSourceItemsubmenu = new DlVMenu({});

    files.foreach(function (file) {
        var item = new DlMenuItem({label: file, parent: ymacsSourceItemsubmenu});
        item.addEventListener("onSelect", function () {
            var request = new DlRPC({url: YMACS_SRC_PATH + file + "?killCache=" + new Date().getTime()});
            request.call({
                callback: function (data) {
                    var code = data.text.replace(/\r\n/g, '\n');
                    var buf = ymacs.getBuffer(file) || ymacs.createBuffer({name: file});
                    buf.setCode(code);
                    buf.cmd("javascript_dl_mode", true);
                    ymacs.switchToBuffer(buf);
                }
            });
        });
    });
    ymacsSourceItem.setMenu(ymacsSourceItemsubmenu);
    mainMenu.addFiller();

    const optionsMenu = new DlMenuItem({parent: mainMenu, label: "Options".makeLabel()});

    const optionsSubmenu = new DlVMenu({});
    optionsMenu.setMenu(optionsSubmenu);

    const indentLevelItem = new DlMenuItem({parent: optionsSubmenu, label: "Set indentation level".makeLabel()});
    indentLevelItem.addEventListener("onSelect", function () {
        var buf = ymacs.getActiveBuffer(), newIndent;
        newIndent = prompt("Indentation level for the current buffer: ", buf.getq("indent_level"));
        if (newIndent != null)
            newIndent = parseInt(newIndent, 10);
        if (newIndent != null && !isNaN(newIndent)) {
            buf.setq("indent_level", newIndent);
            buf.signalInfo("Done setting indentation level to " + newIndent);
        }
    });


    const toggleLineMenuItem = new DlMenuItem({parent: optionsSubmenu, label: "Toggle line numbers".makeLabel()});
    toggleLineMenuItem.addEventListener("onSelect", function () {
        ymacs.getActiveBuffer().cmd("toggle_line_numbers");
    });

    /* -----[ color theme ]----- */

    const colorThemesMenuItem = new DlMenuItem({parent: optionsSubmenu, label: "Color theme".makeLabel()});
    const colorThemesubmenu = new DlVMenu({});
    colorThemesMenuItem.setMenu(colorThemesubmenu);

    [
        "dark|y|Dark background (default)",
        "dark|mishoo|>Mishoo's Emacs theme",
        "dark|billw|>Billw",
        "dark|charcoal-black|>Charcoal black",
        "dark|clarity-and-beauty|>Clarity and beauty",
        "dark|classic|>Classic",
        "dark|gnome2|>Gnome 2",
        "dark|calm-forest|>Calm forest",
        "dark|linh-dang-dark|>Linh Dang Dark",
        "dark|blue-mood|>Blue mood",
        "dark|zenburn|>Zenburn",
        "dark|standard-dark|>Emacs standard (dark)",
        null,
        "light|y|Light background (default)",
        "light|andreas|>Andreas",
        "light|bharadwaj|>Bharadwaj",
        "light|gtk-ide|>GTK IDE",
        "light|high-contrast|>High contrast",
        "light|scintilla|>Scintilla",
        "light|standard-xemacs|>Standard XEmacs",
        "light|vim-colors|>Vim colors",
        "light|standard|>Emacs standard (light)"
    ].foreach(function (theme) {
        if (theme == null) {
            colorThemesubmenu.addSeparator();
        } else {
            theme = theme.split(/\s*\|\s*/);
            var label = theme.pop();
            label = label.replace(/^>\s*/, "&nbsp;".x(4));
            var item = new DlMenuItem({parent: colorThemesubmenu, label: label});
            item.addEventListener("onSelect", ymacs.setColorTheme.$(ymacs, theme));
        }
    });

    /* -----[ font ]----- */

    const fontFamilyMenuItem = new DlMenuItem({parent: optionsSubmenu, label: "Font family".makeLabel()});
    const fontFamilyMenuItemsubmenu = new DlVMenu({});
    fontFamilyMenuItem.setMenu(fontFamilyMenuItemsubmenu);

    const fontFamilyMenuitem = new DlMenuItem({parent: fontFamilyMenuItemsubmenu, label: "Default from ymacs.css"});
    fontFamilyMenuitem.addEventListener("onSelect", function () {
        ymacs.getActiveFrame().setStyle({fontFamily: ""});
    });

    fontFamilyMenuItemsubmenu.addSeparator();

    [
        "Lucida Sans Typewriter",
        "Andale Mono",
        "Courier New",
        "Arial",
        "Verdana",
        "Tahoma",
        "Georgia",
        "Times New Roman"

    ].foreach(function (font) {
        let item = new DlMenuItem({
            parent: fontFamilyMenuItemsubmenu,
            label: "<span style='font-family:" + font + "'>" + font + "</span>"
        });
        item.addEventListener("onSelect", function () {
            ymacs.getActiveFrame().setStyle({fontFamily: font});
        });
    });

    // ymacs.getActiveFrame().setStyle({ fontFamily: "Arial", fontSize: "18px" });

    /* -----[ font size ]----- */

    const fontSizeMenuitem = new DlMenuItem({parent: optionsSubmenu, label: "Font size".makeLabel()});
    const fontSizeMenuitemsubmenu = new DlVMenu({});
    fontSizeMenuitem.setMenu(fontSizeMenuitemsubmenu);

    const fontMenuitem = new DlMenuItem({parent: fontSizeMenuitemsubmenu, label: "Default from ymacs.css"});
    fontMenuitem.addEventListener("onSelect", function () {
        ymacs.getActiveFrame().setStyle({fontSize: ""});
    });

    fontSizeMenuitemsubmenu.addSeparator();

    [
        "11px",
        "12px",
        "14px",
        "16px",
        "18px",
        "20px",
        "22px",
        "24px"

    ].foreach(function (font) {
        let item = new DlMenuItem({
            parent: fontSizeMenuitemsubmenu,
            label: "<span style='font-size:" + font + "'>" + font + "</span>"
        });
        item.addEventListener("onSelect", function () {
            ymacs.getActiveFrame().setStyle({fontSize: font});
        });
    });


    const aboutMenuitem = new DlMenuItem({parent: optionsSubmenu, label: "About"});
    aboutMenuitem.addEventListener("onSelect", function () {
        alert('About org-mode online.')
    });

    layout.packWidget(mainMenu, {pos: "top"});
    layout.packWidget(ymacs, {pos: "bottom", fill: "*"});

    dlg._focusedWidget = ymacs;
    dlg.setSize({x: 800, y: 600});

    // show two frames initially
    // ymacs.getActiveFrame().hsplit();
    ymacs.getActiveFrame().setStyle({fontSize: "22px"});

    dlg.show(true);
    dlg.maximize(true);

} catch (ex) {
    // console.log(ex);
}

DynarchDomUtils.trash(document.getElementById("x-loading"));

if (!is_gecko && !is_khtml) (function () {

    var dlg = new DlDialog({
        title: "Information",
        modal: true,
        quitBtn: "destroy"
    });

    var vbox = new DlVbox({parent: dlg, borderSpacing: 5});
    var tmp = new DlWidget({parent: vbox});
    tmp.getElement().appendChild(document.getElementById("browser-warning"));
    var ok = new DlButton({parent: vbox, focusable: true, label: "OK, let's see it"});
    ok.addEventListener("onClick", dlg.destroy.$(dlg));
    dlg._focusedWidget = ok;

    dlg.show(true);

})();
