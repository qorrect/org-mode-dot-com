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

// @require ymacs-buffer.js

// @require"./lib/lodash";

Ymacs_Buffer.newCommands({

    get_region() {
        return this.getRegion();
    },

    figure_out_mode(code) {
        if (!code)
            code = this.getCode();
        const lines = code.split(/\n/);
        if (lines.length > 4)
            lines.splice(2, lines.length - 4);
        return lines.foreach((line, m) => {
            if ((m = /-\*-\s*(.*?)\s*-\*-/i.exec(line))) {
                $RETURN(m[1]);
            }
        });
    },

    mode_from_name(name) {

        if (!name)
            name = this.name;

        const ext = (/\.[^.]+$/.exec(name) || [''])[0];

        // TODO: the mapping from extension to mode should be defined
        // with each mode.

        switch (ext) {

            case '.css':
                return 'css';

            case '.js':
                return 'javascript';

            case '.lisp':
            case '.scm':
                return 'lisp';
        }

        return null;
    },

    set_buffer_mode(mode) {
        if (!mode)
            mode = this.cmd('figure_out_mode') || this.cmd('mode_from_name');
        if (mode) {
            if (Object.HOP(this.COMMANDS, mode)) {
                this.cmd(mode, true);
            } else if (Object.HOP(this.COMMANDS, mode + '_mode')) {
                this.cmd(mode + '_mode', true);
            }
        }
    },

    cperl_lineup: Ymacs_Interactive('r', function (begin, end) {
        this.cmd('save_excursion', function () {
            let rcend = this._positionToRowCol(end), max = 0, lines = [];
            this.cmd('goto_char', begin);
            this.cmd('forward_whitespace', true);
            const ch = this.charAt();
            if (ch.toLowerCase() != ch.toUpperCase()) {
                this.signalError('Cannot lineup here');
                return;
            }
            while (this._rowcol.row <= rcend.row) {
                const pos = this.getLine().indexOf(ch);
                if (pos >= 0) {
                    if (pos > max)
                        max = pos;
                    lines.push([this._rowcol.row, pos]);
                }
                if (!this.cmd('forward_line'))
                    break;
            }
            ++max;
            lines.foreach(function (l) {
                this.cmd('goto_char', this._rowColToPosition(l[0], l[1]));
                this.cmd('insert', ' '.x(max - l[1]));
            }, this);
        });
    }),

    htmlize_region: Ymacs_Interactive('r\nP', function (begin, end, lineNum) {
        this.tokenizer.finishParsing();
        let row = this._positionToRowCol(begin).row;
        let html = String.buffer();
        let line = row;
        let pad;
        if (lineNum && !lineNum.empty)
            line = parseInt(lineNum, 10);
        end = this._positionToRowCol(end).row;
        pad = String(end).length;
        while (row <= end) {
            html('<div class=\'line\'>');
            if (lineNum)
                html('<span class=\'line-number\'>', line.zeroPad(pad, ' '), '</span>');
            ++line;
            html(this._textProperties.getLineHTML(row, this.code[row], null), '</div>\n');
            ++row;
        }
        html = html.get();
        const tmp = this.ymacs.switchToBuffer('*Htmlize*');
        tmp.setCode(html);
        tmp.cmd('xml_mode', true);
    }),

    execute_extended_command: Ymacs_Interactive('^CM-x ', function (cmd) {
        this.callInteractively(cmd);
    }),

    set_variable: Ymacs_Interactive('vSet variable: \nsTo value: ', function (variable, value) {
        const tmp = parseFloat(value);
        if (!isNaN(tmp))
            value = tmp;
        this.setq(variable, value);
    }),

    eval_string: Ymacs_Interactive('^MEval string: ', function (code) {
        try {
            const variables = [
                this,      // buffer
                this.ymacs // ymacs
            ];
            code = new Function('buffer', 'ymacs', code);
            code.apply(this, variables);
            this.clearTransientMark();
        } catch (ex) {
            this.signalError(ex.type + ': ' + ex.message);
            if (window.console)
                console.log(ex);
        }
    }),

    eval_region: Ymacs_Interactive('^r', function (begin, end) {
        this.cmd('eval_string', this.cmd('buffer_substring', begin, end));
    }),

    eval_buffer: Ymacs_Interactive(function () {
        this.cmd('eval_string', this.getCode());
    }),

    toggle_line_numbers: Ymacs_Interactive('^', function () {
        this.whenActiveFrame('toggleLineNumbers');
    }),

    save_file: Ymacs_Interactive('FWrite file: ', function (name) {
        this.ymacs.ls_setFileContents(name, this.getCode());
        this.signalInfo('Saved in local storage');
    }),

    load_file: Ymacs_Interactive('fFind file: ', function (name) {
        const code = this.ymacs.ls_getFileContents(name);
        const buffer = this.ymacs.createBuffer({name});
        buffer.setCode(code);
        buffer.cmd('set_buffer_mode');
        buffer.cmd('switch_to_buffer', name);
    }),

    find_file: Ymacs_Interactive('FFind file: ', (name) => {
        ymacs.createOrOpen(name.trim());

    }),

    write_file: Ymacs_Interactive('FWrite file: ', function (name) {
        const self = this;

        function write_file() {
            self.ymacs.fs_setFileContents(name, self.getCode(), null, (stamp) => {
                self.cmd('rename_buffer', name);
                self.dirty(false);
                self.stamp = stamp; // refresh stamp
                self.signalInfo('Wrote ' + name);
            });
        }

        const buffer = self.ymacs.getBuffer(name);
        if (!buffer)
            write_file();
        else {
            const msg = 'A buffer is visiting ' + name + '; proceed?';
            buffer.cmd('minibuffer_yn', msg, (yes) => {
                if (yes) {
                    self.ymacs.killBuffer(buffer);
                    write_file();
                }
            });
        }
    }),

    save_some_buffers() {
        this.cmd('save_some_buffers_with_continuation', true, () => {
        });
    },

    save_some_buffers_with_contiWnuation(ask, cont) {

        const bufs = this.ymacs.buffers.slice(); // get copy of buffers

        function loop(saved) {
            if (bufs.length > 0)
                bufs.shift().cmd('save_buffer_with_continuation', ask, loop);
            else
                cont();
        }

        loop(false);
    },

    save_file_to_file_list(name) {
        DAO.get(Strings.Defs.FILE_LIST,[]).then(files => {
            files.push(name);
            DAO.put(Strings.Defs.FILE_LIST, ensureUnique(files));
        });
    },

    save_buffer_with_continuation(ask, cont) {

        const self = this;
        self.dirty(false);
        DAO.put(self.name, self.getCode());
        this.cmd('save_file_to_file_list', self.name);
        cont(true);

        // localStorage.setItem(self.name,self.getCode());
        //
        // function did_save(stamp) {
        //     self.dirty(false);
        //     self.stamp = stamp; // refresh stamp
        //     cont(true);
        // }
        //
        // function do_save() {
        //     self.ymacs.fs_setFileContents(self.name, self.getCode(), self.stamp, function (stamp) {
        //         if (stamp != null) {
        //             did_save(stamp);
        //         } else {
        //             self.cmd("minibuffer_yn", self.name + " has changed since visited or saved.  Save anyway?", function (yes) {
        //                 if (!yes) {
        //                     cont(false);
        //                 } else {
        //                     self.ymacs.fs_setFileContents(self.name, self.getCode(), null, function (stamp) {
        //                         did_save(stamp);
        //                     });
        //                 }
        //             });
        //         }
        //     });
        // }
        //
        // if (!self.dirty() || (ask && self.name.match(/^\*.*\*$/))) {
        //     cont(false);
        // } else if (!ask) {
        //     do_save();
        // } else {
        //     self.cmd("minibuffer_yn", "Save file " + self.name + "?", function (yes) {
        //         if (!yes) {
        //             cont(false);
        //         } else {
        //             do_save();
        //         }
        //     });
        // }
    },

    save_buffer: Ymacs_Interactive('', function () {
        const self = this;
        if (self.dirty())
            self.cmd('save_buffer_with_continuation', false, (saved) => {
                if (saved)
                    self.signalInfo('Wrote ' + self.name);
            });
        else
            self.signalInfo('No changes need to be saved');
    }),

    delete_file: Ymacs_Interactive('fDelete file: ', function (name) {
        const self = this;
        self.ymacs.fs_deleteFile(name, () => {
            self.signalInfo('Deleted ' + name);
        });
    }),

    eval_file: Ymacs_Interactive('fEval file: ', function (name) {
        const self = this;
        self.ymacs.fs_getFileContents(name, false, (code, stamp) => {
            self.cmd('eval_string', code);
        });
    })

});
