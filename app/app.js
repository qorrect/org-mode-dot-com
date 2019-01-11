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

var info = ("Existing keybindings:\n\n" +
    print(Ymacs_Keymap_Emacs().constructor.KEYS)
    + "\n\nHave fun!\n");

try {
    var dlg = new DlDialog({title: "Ymacs", resizable: false});


    var markdown = new Ymacs_Buffer({name: "today.org"});
    markdown.setCode("\
* Sample Org File\n\
\n\
* Next\n" +
        "** asdf asdf \n" +
        "*** Testing \n" +
        "**** This is a test \n" +
        "***** Now its another one \n" +
        "****** Yet another one \n\n" +
        "    - [ ] Write org-mode.js\n" +
        "    - [ ] Get Groceries\n"
    );
    markdown.cmd("org_mode");

    var keys = new Ymacs_Buffer({name: "keybindings.txt"});
    keys.setCode(info);

    var layout = new DlLayout({parent: dlg});

    var empty = new Ymacs_Buffer({name: "empty"});
    var ymacs = window.ymacs = new Ymacs({buffers: [markdown, keys]});
    ymacs.setColorTheme(["dark", "y"]);

    try {
        ymacs.getActiveBuffer().cmd("eval_file", ".ymacs");
    } catch (ex) {
        console.log(ex);
    }

    var menu = new DlHMenu({});
    menu.setStyle({marginLeft: 0, marginRight: 0});

    var item = new DlMenuItem({parent: menu, label: "Your Files".makeLabel()});

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
    var submenu = new DlVMenu({});
    item.setMenu(submenu);
    files.foreach(function (file) {
        var item = new DlMenuItem({label: file, parent: submenu});
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
    menu.addFiller();

    var item = new DlMenuItem({parent: menu, label: "Set indentation level".makeLabel()});
    item.addEventListener("onSelect", function () {
        var buf = ymacs.getActiveBuffer(), newIndent;
        newIndent = prompt("Indentation level for the current buffer: ", buf.getq("indent_level"));
        if (newIndent != null)
            newIndent = parseInt(newIndent, 10);
        if (newIndent != null && !isNaN(newIndent)) {
            buf.setq("indent_level", newIndent);
            buf.signalInfo("Done setting indentation level to " + newIndent);
        }
    });


    var item = new DlMenuItem({parent: menu, label: "Toggle line numbers".makeLabel()});
    item.addEventListener("onSelect", function () {
        ymacs.getActiveBuffer().cmd("toggle_line_numbers");
    });

    /* -----[ color theme ]----- */

    var item = new DlMenuItem({parent: menu, label: "Color theme".makeLabel()});
    var submenu = new DlVMenu({});
    item.setMenu(submenu);

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
            submenu.addSeparator();
        } else {
            theme = theme.split(/\s*\|\s*/);
            var label = theme.pop();
            label = label.replace(/^>\s*/, "&nbsp;".x(4));
            var item = new DlMenuItem({parent: submenu, label: label});
            item.addEventListener("onSelect", ymacs.setColorTheme.$(ymacs, theme));
        }
    });

    /* -----[ font ]----- */

    var item = new DlMenuItem({parent: menu, label: "Font family".makeLabel()});
    var submenu = new DlVMenu({});
    item.setMenu(submenu);

    item = new DlMenuItem({parent: submenu, label: "Default from ymacs.css"});
    item.addEventListener("onSelect", function () {
        ymacs.getActiveFrame().setStyle({fontFamily: ""});
    });

    submenu.addSeparator();

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
        item = new DlMenuItem({parent: submenu, label: "<span style='font-family:" + font + "'>" + font + "</span>"});
        item.addEventListener("onSelect", function () {
            ymacs.getActiveFrame().setStyle({fontFamily: font});
        });
    });

    // ymacs.getActiveFrame().setStyle({ fontFamily: "Arial", fontSize: "18px" });

    /* -----[ font size ]----- */

    var item = new DlMenuItem({parent: menu, label: "Font size".makeLabel()});
    var submenu = new DlVMenu({});
    item.setMenu(submenu);

    item = new DlMenuItem({parent: submenu, label: "Default from ymacs.css"});
    item.addEventListener("onSelect", function () {
        ymacs.getActiveFrame().setStyle({fontSize: ""});
    });

    submenu.addSeparator();

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
        item = new DlMenuItem({parent: submenu, label: "<span style='font-size:" + font + "'>" + font + "</span>"});
        item.addEventListener("onSelect", function () {
            ymacs.getActiveFrame().setStyle({fontSize: font});
        });
    });


    item = new DlMenuItem({parent: menu, label: "About"});
    item.addEventListener("onSelect", function () {
        alert('About org-mode online.')
    });

    layout.packWidget(menu, {pos: "top"});
    layout.packWidget(ymacs, {pos: "bottom", fill: "*"});

    dlg._focusedWidget = ymacs;
    dlg.setSize({x: 800, y: 600});

    // show two frames initially
    // ymacs.getActiveFrame().hsplit();
    ymacs.getActiveFrame().setStyle({fontSize: "22px"});

    dlg.show(true);
    dlg.maximize(true);

} catch (ex) {
    console.log(ex);
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
