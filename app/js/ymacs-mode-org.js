//>
// @require ymacs-tokenizer.js
// @require lib/lodash.js
// @require lib/async.js

const HEADING_REGEX = /(\*)+/;
const FOLDED_REGEX = /\(...(\d+)\)/;

// Our memory hungry hide ring
const HIDE_RING = {};

DEFINE_SINGLETON("Ymacs_Keymap_OrgMode", Ymacs_Keymap, function (D, P) {

    D.KEYS = {

        "C-c C-c": "org_ctrl_c_ctrl_c",
        "[": "auto_insert_braces",
        "]": "auto_fix_braces",

        // User friendly keybindings

        "C-c c": "kill_ring_save",
        "C-c v": "yank",
    };

});

DEFINE_SINGLETON("Ymacs_Keymap_OrgMode", Ymacs_Keymap_OrgMode().constructor, function (D, P) {
});

function safePush(obj, label, element) {
    if (obj[label.toString()] !== undefined) {
        obj[label.toString()].push(element);
    } else {
        obj[label.toString()] = [element];
    }
}

Ymacs_Tokenizer.define("org", function (stream, tok) {

    var PARSER = {next: next, copy: copy, indentation: indentation};

    function copy() {
        var context = restore.context = {};

        function restore() {
            return PARSER;
        };
        return restore;
    };

    function foundToken(c1, c2, type) {
        tok.onToken(stream.line, c1, c2, type);
    };

    function next() {
        stream.checkStop();
        var tmp;

        // If its a line heading
        if (stream.col === 0 && (tmp = stream.lookingAt(/^(\*+)/))) {
            const isFolded = stream.lineText().match(FOLDED_REGEX);

            if (isFolded) {
                foundToken(0, stream.col = stream.lineLength() - isFolded[0].length, "org-heading-" + tmp[0].length);
            } else {
                foundToken(0, stream.col = stream.lineLength(), "org-heading-" + tmp[0].length);
            }
        }
        // If its folded
        else if ((tmp = stream.lookingAt(FOLDED_REGEX))) {

            const line = stream.lineText();
            let orgLevel = 0;
            const match = line.match(HEADING_REGEX);
            if (match) orgLevel = match[0].length;

            foundToken(stream.col, stream.col += tmp[0].length, "org-folded-" + orgLevel);

        }
        // If nothing was found than just increment the column
        else {
            foundToken(stream.col, ++stream.col, null);
        }
    };

    function indentation() {
        return _do_indent(stream);
    }

    function _do_indent(stream) {
        const currentLine = stream.lineText();
        const previousLine = stream.lineText(stream.line - 1);

        // If its on an org-heading
        if (currentLine && currentLine.match(/^\*/)) {
            const res = FOLDED_REGEX.exec(currentLine);
            if (res && HIDE_RING[res[1]]) {

                const cache = HIDE_RING[res[1]];
                const prefix = cache.length ? "\n" : "";

                stream.buffer._replaceLine(stream.buffer._rowcol.row, currentLine.toString().replace("(..." + res[1] + ")", ""));
                stream.buffer.cmd("end_of_line");
                stream.buffer._insertText(prefix + cache.join("\n"), stream.buffer.caretMarker.getPosition());
                stream.buffer.cmd("end_of_line");

            } else {
                const pos = Object.keys(HIDE_RING).length;
                HIDE_RING[pos] = ensureList(HIDE_RING[pos]);

                console.dir(stream);
                let line = stream.lineText();

                stream.buffer.cmd("end_of_line");
                stream.buffer._replaceLine(stream.line, line + "(..." + pos + ")");

                let orgLevel = 0;
                const match = line.match(HEADING_REGEX);
                if (match) orgLevel = match[0].length;

                stream.nextLine();
                line = stream.lineText();

                while (line) {

                    let isAHeadingMatch = line.match(HEADING_REGEX);
                    let found = false;
                    if (isAHeadingMatch) {
                        if (isAHeadingMatch[0].length <= orgLevel) break;
                        if (line.match(FOLDED_REGEX)) break;
                        else {
                            const originalStream = _.clone(stream);
                            _do_indent(stream);
                            stream = originalStream;
                            if (stream && stream.lineText) {
                                line = stream.lineText();
                                safePush(HIDE_RING, pos, line);
                                stream.buffer._deleteLine(stream.line);
                                found = true;
                                line = stream.lineText();
                            } else break;
                        }
                    } else {

                        safePush(HIDE_RING, pos, line);
                        stream.buffer._deleteLine(stream.line);
                        found = true;
                        line = stream.lineText();

                    }
                    if (!found) {
                        stream.nextLine();
                        line = stream.lineText();
                    }
                }
            }
        } else {

            let previousIndent = previousLine.search(/\S/);
            previousIndent = previousIndent > 0 ? previousIndent : 0;
            const currentIndent = currentLine.search(/\S/);

            // Start of line, go to existing indent
            if (currentIndent === 0) {
                return previousIndent ? previousIndent > 0 : INDENT_LEVEL();
            } else if (currentIndent === 2 * previousIndent ||
                (currentIndent > previousIndent && (currentIndent % INDENT_LEVEL()) === 0)) {
                return previousIndent;
            } else return currentIndent + INDENT_LEVEL();
        }
    }

    function INDENT_LEVEL() {
        return stream.buffer.getq("indent_level");
    };


    return PARSER;

});

Ymacs_Buffer.newMode("org_mode", function () {

    var tok = this.tokenizer;
    this.setTokenizer(new Ymacs_Tokenizer({buffer: this, type: "org"}));
    this.pushKeymap(Ymacs_Keymap_OrgMode());

    return function () {
        this.setTokenizer(tok);
    };

});


Ymacs_Buffer.newCommands({

    org_ctrl_c_ctrl_c: Ymacs_Interactive(function () {
        this.cmd("org_toggle_check");
    }),

    org_ctrl_c_c: Ymacs_Interactive(function () {
        this.cmd("kill_ring_save");
    }),

    auto_insert_braces: Ymacs_Interactive(function () {
        this.cmd("insert", "[ ] ");

    }),

    auto_fix_braces: Ymacs_Interactive(function () {
        const str = this.cmd("buffer_substring", this.point() - 5, this.point());

        if (str === '[ ]  ') {
            this.cmd("backward_char");
        } else this.cmd("insert", "]");


    }),
});
