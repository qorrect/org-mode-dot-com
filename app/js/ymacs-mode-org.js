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
    if (obj[label] !== undefined) {
        obj[label].push(element);
    } else {
        obj[label] = [];
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

        if ((tmp = stream.lookingAt("[ ]"))) {
        } else if (stream.col == 0 && (tmp = stream.lookingAt(/^(\*+)/))) {
            foundToken(0, stream.col = stream.lineLength(), "markdown-heading" + tmp[0].length);
        } else if (stream.line > 0 && stream.col == 0 && (tmp = stream.lookingAt(/^[=-]+$/)) && /\S/.test(stream.lineText(stream.line - 1))) {
            tmp = tmp[0].charAt(0) == "=" ? 1 : 2;
            tmp = "markdown-heading" + tmp;
            tok.onToken(stream.line - 1, 0, stream.lineLength(stream.line - 1), tmp);
            foundToken(0, stream.col = stream.lineLength(), tmp);
        } else if (stream.col == 0 && (tmp = stream.lookingAt(/^[>\s]*/))) {
            tmp = tmp[0].replace(/\s+/g, "").length;
            if (tmp > 3)
                tmp = "";
            tmp = "markdown-blockquote" + tmp;
            foundToken(0, stream.col = stream.lineLength(), tmp);
        } else {
            foundToken(stream.col, ++stream.col, null);
        }
    };

    function indentation() {

        window.HIDE_RING = HIDE_RING;
        var currentLine = stream.lineText();
        var previousLine = stream.lineText(stream.line - 1);

        console.log('previousLine');
        console.log(previousLine);
        console.log('currentLine');
        console.log(currentLine);
        if (currentLine && currentLine.match(/^\*/)) {
            const res = /\((...\d+)\)/.exec(currentLine);
            if (res && HIDE_RING[res[1]]) {
                console.log(res[1]);
                console.log(currentLine);
                const cache = HIDE_RING[res[1]];
                console.log(cache);
                // stream.nextLine();
                // stream.eol();
                stream.buffer.cmd("end_of_line");
                stream.buffer._insertText(cache.join("\n"), stream.buffer.caretMarker.getPosition() + 1);
                delete HIDE_RING[res[1]];
                stream.buffer._replaceLine(stream.buffer._rowcol.row, currentLine.toString().replace("(" + res[1] + ")", ""));
                stream.buffer.cmd("end_of_line");


            } else {
                const pos = Object.keys(HIDE_RING).length;

                safePush(HIDE_RING, "..." + pos, stream.lineText());

                stream.nextLine();
                stream.eol();
                stream.buffer.cmd("end_of_line");

                stream.buffer._insertText("(..." + pos + ")");

                let line = stream.lineText();
                while (line.match(/^\*/)) {
                    safePush(HIDE_RING, "..." + pos, line);
                    console.log('Deleteing ' + line);
                    stream.buffer._deleteLine(stream.line);
                    line = stream.lineText();
                    console.log('lin');
                    console.log(line);
                }
                safePush(HIDE_RING, "..." + pos, stream.lineText());

                stream.nextLine();

                while (!stream.eof()) {

                    if (line.match(/^\*/)) break;
                    safePush(HIDE_RING, "..." + pos, stream.lineText());
                    console.log('Deleteing ' + line);
                    stream.buffer._deleteLine(stream.line);
                    line = stream.lineText();
                    console.log('lin');
                    console.log(line);
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
            } else return previousIndent + INDENT_LEVEL();
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
