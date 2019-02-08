/* eslint-disable no-param-reassign */
//>
// @require ymacs-tokenizer.js
// @require lib/lodash.js
// @require lib/async.js
// @require js/dao/index.js

const HEADING_REGEX = /(\*)+/;
const FOLDED_REGEX = /\.\.\./;
const FOLDED_STR = '...';
// Our memory hungry hide ring
const FOLDED_RING = {};

DEFINE_SINGLETON('Ymacs_Keymap_OrgMode', Ymacs_Keymap, (D) => {

    D.KEYS = {

        'C-c C-c': 'org_ctrl_c_ctrl_c',
        '[': 'auto_insert_braces',
        ']': 'auto_fix_braces',
        'C-x C-s': 'org_save_buffer',
        'C-+': 'org_expand_buffer',
        // User friendly keybindings

        'C-x c': 'kill_ring_save',
        'C-x v': 'yank',

    };

});


function safePush(obj, label, element) {
    if (obj[label.toString()] !== undefined) {
        obj[label.toString()].push(element);
    } else {
        obj[label.toString()] = [element];
    }
}

Ymacs_Tokenizer.define('org', (stream, tok) => {

    const PARSER = {next, copy, indentation};

    function copy() {
        restore.context = {};

        function restore() {
            return PARSER;
        }

        return restore;
    }

    function foundToken(c1, c2, type) {
        tok.onToken(stream.line, c1, c2, type);
    }

    function next() {
        stream.checkStop();
        let tmp;

        // If its a line heading
        if (stream.col === 0 && (tmp = stream.lookingAt(/^(\*+)/))) {

            foundToken(0, stream.col = stream.lineLength(), 'org-heading-' + tmp[0].length);

        }
        // If its folded
        // else if ((tmp = stream.lookingAt(FOLDED_REGEX))) {
        //
        //     const line = stream.lineText();
        //     let orgLevel = 0;
        //     const match = line.match(HEADING_REGEX);
        //     if (match) orgLevel = match[0].length;
        //
        //     foundToken(stream.col, stream.col += tmp[0].length, 'org-folded-' + orgLevel);
        //
        // }
        // If nothing was found than just increment the column
        else {
            foundToken(stream.col, ++stream.col, null);
        }
    }

    function indentation() {
        return _do_indent(stream);
    }

    function _do_indent(local_stream) {
        const currentLineNumber = local_stream.line;
        const currentLine = local_stream.lineText();
        const previousLine = local_stream.lineText(local_stream.line - 1);
        console.log('currentLineNumber=' + currentLineNumber);

        console.log('MARKERS');
        console.log(local_stream.buffer.markers);
        local_stream.buffer.markers.forEach(marker => console.log(`Rowcol=${JSON.stringify(marker.getRowCol())}`));
        // If its on an org-heading
        if (currentLine && currentLine.match(/^\*/)) {

            const found = local_stream.buffer.markers.filter(marker => marker.name === Keys.FOLDED_MARKER).some(marker => {
                const markerLine = marker.getRowCol().row;

                if (markerLine == currentLineNumber) {
                    const code = FOLDED_RING[marker.id];
                    const insertString = '\n' + code.join(Keys.NEWLINE);
                    // const pos = local_stream.buffer.caretMarker.getPosition();
                    const position = marker.getPosition();
                    local_stream.buffer._insertText(insertString, position);
                    _.remove(local_stream.buffer.markers, (mark) => mark.id === marker.id);
                    return true;
                }
                return false;

            });
            if (!found) {
                let line = local_stream.lineText();

                local_stream.buffer.cmd('end_of_line');
                // local_stream.buffer._replaceLine(local_stream.line, line + FOLDED_STR);
                const foldedMarker = local_stream.buffer.createMarker(local_stream.buffer.caretMarker.getPosition(), true, Keys.FOLDED_MARKER);
                // local_stream.buffer.markers.push(foldedMarker);

                const id = foldedMarker.id;
                //     const pos = Object.keys(FOLDED_RING).length;
                FOLDED_RING[id] = ensureList(FOLDED_RING[id]);
                //

                local_stream.buffer.cmd('end_of_line');
                // local_stream.buffer._replaceLine(local_stream.line, line + FOLDED_STR);

                let orgLevel = 0;
                const match = line.match(HEADING_REGEX);
                if (match) orgLevel = match[0].length;

                local_stream.nextLine();
                line = local_stream.lineText();

                while (line) {
                    // while (line) {

                    const isAHeadingMatch = line.match(HEADING_REGEX);
                    let isFound = false;
                    if (isAHeadingMatch) {
                        if (isAHeadingMatch[0].length <= orgLevel) break;
                        if (line.match(FOLDED_REGEX)) break;
                        else {
                            break;
                        }
                    } else {
                        // alert('update markers');

                        safePush(FOLDED_RING, id, line);
                        local_stream.buffer._deleteLine(local_stream.line);
                        local_stream.buffer._updateMarkers(local_stream.buffer.caretMarker.getPosition(), -line.length, 0, Keys.FOLDED_MARKER);
                        console.log('updating markers');
                        isFound = true;
                        line = local_stream.lineText();

                    }
                    if (!isFound) {
                        local_stream.nextLine();
                        line = local_stream.lineText();
                    }
                }


            }
            //

            // }
            // const res = FOLDED_REGEX.exec(currentLine);
            // if (res && FOLDED_RING[res[1]]) {
            //
            //     const cache = FOLDED_RING[res[1]];
            //     const prefix = cache.length ? '\n' : '';
            //
            //     local_stream.buffer._replaceLine(local_stream.buffer._rowcol.row, currentLine.toString().replace('... (...' + res[1] + ')', ''));
            //     local_stream.buffer.cmd('end_of_line');
            //     local_stream.buffer._insertText(prefix + cache.join('\n'), local_stream.buffer.caretMarker.getPosition());
            //     local_stream.buffer.cmd('end_of_line');
            //
            // } else {
            //     const pos = Object.keys(FOLDED_RING).length;
            //     FOLDED_RING[pos] = ensureList(FOLDED_RING[pos]);
            //
            //     let line = local_stream.lineText();
            //
            //     local_stream.buffer.cmd('end_of_line');
            //     local_stream.buffer._replaceLine(local_stream.line, line + '... (...' + pos + ')');
            //
            //     let orgLevel = 0;
            //     const match = line.match(HEADING_REGEX);
            //     if (match) orgLevel = match[0].length;
            //
            //     local_stream.nextLine();
            //     line = local_stream.lineText();
            //
            //     while (line) {
            //
            //         const isAHeadingMatch = line.match(HEADING_REGEX);
            //         let found = false;
            //         if (isAHeadingMatch) {
            //             if (isAHeadingMatch[0].length <= orgLevel) break;
            //             if (line.match(FOLDED_REGEX)) break;
            //             else {
            //                 const originalStream = _.clone(local_stream);
            //                 _do_indent(local_stream);
            //                 local_stream = originalStream;
            //                 if (local_stream && local_stream.lineText) {
            //                     line = local_stream.lineText();
            //                     safePush(FOLDED_RING, pos, line);
            //                     local_stream.buffer._deleteLine(local_stream.line);
            //                     found = true;
            //                     line = local_stream.lineText();
            //                 } else break;
            //             }
            //         } else {
            //
            //             safePush(FOLDED_RING, pos, line);
            //             local_stream.buffer._deleteLine(local_stream.line);
            //             found = true;
            //             line = local_stream.lineText();
            //
            //         }
            //         if (!found) {
            //             local_stream.nextLine();
            //             line = local_stream.lineText();
            //         }
            //     }
            // }

        } else {

            let previousIndent = previousLine.search(/\S/);
            previousIndent = previousIndent > 0 ? previousIndent : 0;
            const currentIndent = currentLine.search(/\S/);

            // Start of line, go to existing indent
            if (currentIndent <= 0) {
                let ret = previousIndent;
                if (previousIndent <= 0) {
                    ret = INDENT_LEVEL();
                }
                return ret;
            } else if (currentIndent === 2 * previousIndent ||
                (currentIndent > previousIndent && (currentIndent % INDENT_LEVEL()) === 0)) {
                return previousIndent;
            } else return currentIndent + INDENT_LEVEL();
        }
    }

    function INDENT_LEVEL() {
        return stream.buffer.getq('indent_level');
    }


    return PARSER;

});

Ymacs_Buffer.newMode('org_mode', function () {

    const tok = this.tokenizer;
    this.setTokenizer(new Ymacs_Tokenizer({buffer: this, type: 'org'}));
    this.pushKeymap(Ymacs_Keymap_OrgMode());

    return function () {
        this.setTokenizer(tok);
    };

});


function expandAllFolds(code, folded_ring) {
    alert('implement this');
    // const keys = Object.keys(folded_ring).sort();
    // for (let i = 0; i < keys.length; i++) {
    //     const key = keys[i];
    //     code = code.replace(`... (...${key})`, '\n' + folded_ring[key].join('\n'));
    // }
    return code;
}

Ymacs_Buffer.newCommands({


    org_ctrl_c_ctrl_c: Ymacs_Interactive(function () {
        this.cmd('beginning_of_line');
        const begin = this._rowColToPosition(this._rowcol.row, 0);
        const rc = this._rowcol;
        const end = this._rowColToPosition(rc.row, this.code[rc.row].length);

        const line = this._bufferSubstring(begin, end);
        const new_line = line.includes('[ ]') ? line.replace('[ ]', '[X]') : line.replace('[X]', '[ ]');
        this._replaceLine(rc.row, new_line);
        this._recordChange(2, begin, line.length, line);
        this._recordChange(1, begin, new_line.length, new_line);
        this._updateMarkers(begin, line.length);
    }),

    org_ctrl_c_c: Ymacs_Interactive(function () {
        this.cmd('kill_ring_save');
    }),

    auto_insert_braces: Ymacs_Interactive(function () {
        this.cmd('insert', '[ ] ');

    }),

    org_expand_line: Ymacs_Interactive(function () {
        console.dir(this);
        // const res = FOLDED_REGEX.exec(currentLine);
        // if (res && HIDE_RING[res[1]]) {
        //
        //     const cache = HIDE_RING[res[1]];
        //     const prefix = cache.length ? "\n" : "";
        //
        //     stream.buffer._replaceLine(stream.buffer._rowcol.row, currentLine.toString().replace("... (..." + res[1] + ")", ""));
        //     stream.buffer.cmd("end_of_line");
        //     stream.buffer._insertText(prefix + cache.join("\n"), stream.buffer.caretMarker.getPosition());
        //     stream.buffer.cmd("end_of_line");
        //
        // }
    }),

    auto_fix_braces: Ymacs_Interactive(function () {
        const str = this.cmd('buffer_substring', this.point() - 5, this.point());

        if (str === '[ ]  ') {
            this.cmd('backward_char');
        } else this.cmd('insert', ']');


    }),

    org_expand_buffer: Ymacs_Interactive(function () {
        const pos = this.caretMarker.getPosition();

        const code = this.getCode();
        this.setCode(expandAllFolds(code, FOLDED_RING));
        this.cmd('goto_char', pos);

    }),

    org_save_buffer: Ymacs_Interactive(function () {

        const code = this.getCode();
        DAO.put(this.name, expandAllFolds(code, FOLDED_RING)).then(() => {
            // window.Q = this.__undoQueue;
            // DAO.put(this.name + '_undoring', this.__undoQueue.map(o => JSON.stringify(o))).then(() => {
            this.dirty(false);

            // })
        });

    }),

});
