//> This file is part of Ymacs, an Emacs-like editor for the Web
//> http://www.ymacs.org/
//>
//> Copyright (c) 2009-2012, Mihai Bazon, Dynarch.com.  All rights reserved.
//>
//> Redistribution and use in source and binary forms, with or without
//> modification, are permitted provided that the following conditions are
//> met:
//>
//>     * Redistributions of source code must retain the above copyright
//>       notice, this list of conditions and the following disclaimer.
//>
//>     * Redistributions in binary form must reproduce the above copyright
//>       notice, this list of conditions and the following disclaimer in
//>       the documentation and/or other materials provided with the
//>       distribution.
//>
//>     * Neither the name of Dynarch.com nor the names of its contributors
//>       may be used to endorse or promote products derived from this
//>       software without specific prior written permission.
//>
//> THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
//> EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
//> IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
//> PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE
//> FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
//> CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
//> SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
//> INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
//> CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
//> ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
//> THE POSSIBILITY OF SUCH DAMAGE.

// @require ymacs-tokenizer.js

const HEADING_REGEX = /(\*)+/;
const FOLDED_REGEX = /\(...(\d+)\)/;


DEFINE_SINGLETON("Ymacs_Keymap_OrgMode", Ymacs_Keymap, function (D, P) {

    D.KEYS = {
        "C-c C-c": "org_ctrl_c_ctrl_c",
        "[": "auto_insert_braces",
        "]": "auto_fix_braces"

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
    var HIDE_RING = {};

    var PARSER = {next: next, copy: copy, indentation: indentation, hideRing: HIDE_RING};

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

        if ((tmp = stream.lookingAt(FOLDED_REGEX))) {
            console.log('here ' + tmp);
            foundToken(stream.col, stream.col + 4, "org-folded-" + tmp[0].length);
        }
        if (stream.col == 0 && (tmp = stream.lookingAt(/^(\*+)/))) {
            foundToken(0, stream.col = stream.lineLength(), "org-level-" + tmp[0].length);
        } else {
            foundToken(stream.col, ++stream.col, null);
        }
    };

    function indentation() {

        window.HIDE_RING = HIDE_RING;

        return _do_indent(stream);

    }

    function _do_indent(stream) {
        const currentLine = stream.lineText();
        const previousLine = stream.lineText(stream.line - 1);

        if (currentLine && currentLine.match(/^\*/)) {
            const res = FOLDED_REGEX.exec(currentLine);
            if (res && HIDE_RING[res[1]]) {

                const cache = HIDE_RING[res[1]];

                stream.buffer._replaceLine(stream.buffer._rowcol.row, currentLine.toString().replace("(..." + res[1] + ")", ""));
                stream.buffer.cmd("end_of_line");
                stream.buffer._insertText("\n" + cache.join("\n"), stream.buffer.caretMarker.getPosition());
                stream.buffer.cmd("end_of_line");

                // delete HIDE_RING[res[1]];

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

                // prepare the next line for the while loop
                stream.nextLine();
                line = stream.lineText();

                while (line) {

                    let x = line.match(HEADING_REGEX);
                    let found = false;
                    if (x) {
                        if (x[0].length <= orgLevel) break;
                        if (line.match(FOLDED_REGEX)) break;
                        else {
                            console.log('FOUND A SUB HEADING');

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
