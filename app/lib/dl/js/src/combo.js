//> This file is part of DynarchLIB, an AJAX User Interface toolkit
//> http://www.dynarchlib.com/
//>
//> Copyright (c) 2004-2011, Mihai Bazon, Dynarch.com.  All rights reserved.
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

// @require completionentry.js

DEFINE_CLASS("DlComboBox", DlCompletionEntry, function(D, P){

        D.DEFAULT_ARGS = {
                _noSelect  : [ "noSelect"  , false  ],
                __smart    : [ "smart"     , false  ],
                __noTab    : [ "noTab"     , true   ],
                _options   : [ "options"   , null   ],
                _sizeToFit : [ "sizeToFit" , true   ],
                _electric  : [ "electric"  , false  ]
        };

        // P.ALIGN = {
	// 	prefer: "Bl",
	// 	fallX1: "_l",
	// 	fallX2: "_L",
	// 	fallY1: "B_",
	// 	fallY2: "T_"
	// };

        P._createElement = function() {
                D.BASE._createElement.apply(this, arguments);
                this._makeButton(null, null, "DlComboBox-dropDownBtn", {
                        hover: "DlComboBox-dropDownBtn-hover"
                }).addEventListener("onMouseDown", btnEvent.$(this));
                this.addEventListener("onCompletion", this.doCompletion);
        };

        P._on_menuHide = function() {
                D.BASE._on_menuHide.call(this);
                this._btn.delClass("DlComboBox-dropDownBtn-active");
        };

        function btnEvent(ev) {
                if (ev.button == 0) {
                        this._forcePopup();
                        DlException.stopEventBubbling();
                }
        };

        P._forcePopup = function() {
                this._btn.addClass("DlComboBox-dropDownBtn-active");
                this.__forced = true;
                this.doCompletion(null);
                this.focus.delayed(0, this);
        };

        P.doCompletion = function(range) {
                var val = "", comp = [];
                if (range) {
                        val = this.getValue().trim().toLowerCase();
                        if (!val)
                                return this.cancelCompletion();
                }
                var a = this._options;
                if (a instanceof Function) {
                        a = a.apply(this, arguments);
                        if (a == null)
                                return;
                }
                a.foreach(function(opt){
                        if (opt.toLowerCase().indexOf(val) == 0) {
                                comp.push({ label      : opt.htmlEscape(),
                                            start      : 0,
                                            completion : opt });
                        }
                });
                if (comp.length > 0)
                        this.completionReady(comp);
                else
                        this.cancelCompletion();
        };

});
