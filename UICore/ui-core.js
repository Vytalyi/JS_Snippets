/*
	Content:
	-- window.UICore.Checkbox
	-- window.UICore.Dropdown
	-- window.UICore.ButtonsGroup
	-- window.UICore.FileUploader
	-- window.UICore.Switcher
*/
window.UICore = window.UICore || {};


// -- window.UICore.Checkbox
window.UICore.Checkbox = (function($) {
	/**
	 * Custom checkbox constructor function
	 * options.el {String} Contains jQuery selector original checkbox
	*/
	var Checkbox = function(options) {
		// fix options object
		options = options || {};
		options.el = options.el || "";

		// save options
		this.el = $(options.el);

		this.init();

		return this;
	};
	/**
	 * Init method used to replace original checkbox with custom
	*/
	Checkbox.prototype.init = function() {
		if (this.el.length > 0) {
			var newCheckbox = $("<span></span>").addClass("checkbox");

			// copy necessary options from original checkbox
			if (this.el.is(":checked")) {
				newCheckbox.addClass("checked");
			}
			if (!this.el.hasClass("hidden")) {
				newCheckbox.addClass("hidden");
			}

			// build HTML
			this.newEl = newCheckbox;
			this.el.hide();
			this.el.after(newCheckbox);

			this.attachEvents();
		}
	};
	/**
	 * Attach Event method used to attach all necessary events
	*/
	Checkbox.prototype.attachEvents = function() {
		var self = this;

		// handle original checkbox events
		self.el.on("change", function() {
			self.el.trigger("sync");
		});
		self.el.on("sync", function() {
			var isChecked = self.el.is(":checked");
			if (isChecked) {
				self.newEl.filter(":not(.checked)").addClass("checked");
			}
			else {
				self.newEl.filter(".checked").removeClass("checked");
			}
		});

		// handle new checkbox events
		self.newEl.on("click", function() {
			self.newEl.trigger("toggle");
		});
		self.newEl.on("toggle", function() {
			var isChecked = self.newEl.hasClass("checked");
			if (isChecked) {
				self.newEl.removeClass("checked");
				self.el.prop("checked", false).change();
			}
			else {
				self.newEl.addClass("checked");
				self.el.prop("checked", true).change();
			}
		});
	};

	return Checkbox;
})(window.jQuery);


// -- window.UICore.Dropdown
window.UICore.Dropdown = (function($) {
	/**
	 * Custom dropdown constructor function
	 * options.el {String} Contains jQuery selector original dropdown
     * options.width {String} Contains CSS property to set as a width for dropdown
     * options.height {String} Contains CSS property to set as a height for dropdown
	*/
	var Dropdown = function(options) {
		// fix options object
		options = options || {};
		options.el = options.el || "";
        options.width = options.width || "230px";
        options.height = options.height || "2em";

		// save options
		this.el = $(options.el);
		this.list = null;
        this.width = options.width;
        this.height = options.height;

		this.init();

		return this;
	};
	/**
	 * Init method used to replace original dropdown with custom
	*/
	Dropdown.prototype.init = function() {
		if (this.el.length > 0) {
			var newDropdown = $("<div/>").addClass("dropdown"),
				opener = $("<p/>").addClass("dropdown-opener"),
				list = $("<ul/>").addClass("closed");

			// pull list of available options from original dropdown
			opener.html( this.el.find(":selected").html() );
			this.el.find("option").each(function() {
				var sourceItem = $(this),
					listItem = $("<li/>");
				listItem.html( sourceItem.html() );
				listItem.attr( "data-value", sourceItem.val() );
				if (sourceItem.is(":selected")) {
					listItem.attr("data-selected", "selected");
				}
                if (sourceItem.attr("disabled")) {
                    listItem.addClass("disabled");
                }

				listItem.appendTo( list );
			});

			// styling
			newDropdown.css({
				width: this.width,
				padding: this.el.css("padding"),
				height: this.height
			});
			list.css({
				top: this.el.height() + "px"
			});
			opener.css({
				height: this.height,
				lineHeight: this.height
			});

			// build html
			newDropdown.append(opener, list);
			this.list = list;
			this.newEl = newDropdown;
			this.opener = opener;
			this.el.addClass("processed");
			this.el.hide();
			this.el.after(this.newEl);

			this.attachEvents();
		}
	};
	/**
	 * Attach Event method used to attach all necessary events
	*/
	Dropdown.prototype.attachEvents = function() {
		var self = this;

        self.el.on("change", function() {
			self.el.trigger("sync");
		});
		self.el.on("sync", function() {
			var selectedItem = self.el.find(":selected");
			self.newEl.trigger("select", { value: selectedItem.val(), html: selectedItem.html() });
		});
		self.opener.on("click", function() {
			self.newEl.trigger("toggle");
		});
		self.newEl.find("li").on("click", function() {
            if ($(this).hasClass("disabled")) {
                return false;
            }
			self.newEl.trigger("select", { value: $(this).attr("data-value"), html: $(this).html() });
		});

		self.newEl.on("toggle", function() {
			var isClosed = self.list.hasClass("closed");
			if (isClosed) {
				self.closeAll();
				self.list.removeClass("closed");
			}
			else {
				self.list.addClass("closed");
			}
		});
		self.newEl.on("select", function(e, options) {
			if (self.getValue() != options.value) {
				self.opener.html( options.html );
				self.list.find("li[data-selected=selected]").removeAttr("data-selected");
				self.list.find("li[data-value='" + options.value + "']").attr("data-selected", "selected");
				self.newEl.trigger( "toggle" );
				self.el.val( options.value );
				self.el.trigger( "change" );
			}
		});
		if (!Dropdown.prototype.commonEventsAttached) {
            // hide all currently opened dropdowns if click outside fired
			$(document).on("click", function(e) {
				if (!$(e.target).hasClass("dropdown-opener")) {
					self.closeAll();
				}
			});

            // capture keydown to implement searching by first letters
            $(document).on("keydown", function(e) {
                var curDropdown = $(".dropdown ul:not(.closed)");
                if (curDropdown.length > 0) {
                    clearTimeout(timer);
                    var timer = setTimeout(function() {
                        Dropdown.prototype.searchterms = [];
                    }, 1000);

                    Dropdown.prototype.searchterms.push(String.fromCharCode(e.which));
                    if (Dropdown.prototype.searchterms.length > 0) {
                        var strToSearch = Dropdown.prototype.searchterms.join("").toLowerCase();
                        var matches = curDropdown.find("li").filter(function() {
                            return $(this).text().toLowerCase().indexOf(strToSearch) === 0;
                        });
                        if (matches.length > 0) {
                            curDropdown.scrollTop(0);
                            curDropdown.scrollTop(matches.first().position().top);
                        }
                    }
                }
            });
			Dropdown.prototype.commonEventsAttached = true;
            Dropdown.prototype.searchterms = [];
		}
	};
	/**
	 * Close All method used to close all currently opened dropdowns on page
	*/
	Dropdown.prototype.closeAll = function() {
		$(".dropdown ul:not(.closed)").each(function() {
			$(this).addClass("closed");
		});
	};
	/**
	 * Get Value method used to get currently selected value of dropdown
	*/
	Dropdown.prototype.getValue = function() {
		return this.el.val();
	};

	return Dropdown;
})(window.jQuery);


// -- window.UICore.ButtonsGroup
window.UICore.ButtonsGroup = (function($) {
    /**
     * Dropdown buttons group constructor function
     * options.el {String} Contains jQuery selector of buttons group wrapper
     */
    var ButtonsGroup = function(options) {
        // fix options object
        options = options || {};
        options.el = $(options.el) || "";

        // save options
        this.el = options.el;

        // run initialization of widget
        this.init();

        return this;
    };
    /**
     * Init method used to apply necessary classes
     */
    ButtonsGroup.prototype.init = function() {
        if (this.el.length > 0) {
            this.el.addClass("buttons-dropdown");
            this.opener = this.el.find("> a").addClass("buttons-dropdown-opener");
            this.list = this.el.find("> ul").addClass("buttons-dropdown-list");

            if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
                // firefox won't fit input to the full width of container, so we'll need to calculate width
                var maxCharCount = 0;
                this.list.find("li input").each(function() {
                    var charsCount = $(this).val().length;
                    if (charsCount > maxCharCount) {
                        maxCharCount = charsCount;
                    }
                });
                this.list.css("width", (maxCharCount*7 + 40) + "px");
            }

            this.attachEvents();
        }
    };
    /**
     * Attach Event method used to attach all necessary events
     */
    ButtonsGroup.prototype.attachEvents = function() {
        var self = this;

        this.opener.on("click", function() {
            var isExpanded = self.list.hasClass("expanded");
            if (isExpanded) {
                self.list.removeClass("expanded");
            } else {
                self.list.addClass("expanded");
            }
        });

        // listen to click on document - bind this event only once
        if (!ButtonsGroup.prototype.commonEventsAttached) {
			$(document).on("click", function(e) {
				if (!$(e.target).hasClass("buttons-dropdown-opener")) {
					self.closeAll();
				}
			});
			ButtonsGroup.prototype.commonEventsAttached = true;
		}
    };
    /**
	 * Close All method used to close all currently expanded dropdown buttons on page
	*/
    ButtonsGroup.prototype.closeAll = function() {
		$(".buttons-dropdown ul.expanded").each(function() {
			$(this).removeClass("expanded");
		});
	};

    return ButtonsGroup;
})(window.jQuery);


// -- window.TP.UICore.FileUploader
window.UICore.FileUploader = (function($) {
    /**
     * Constructor function for File Upload widget
     * options.el {String} Contains jQuery selector of file input
     */
    var FileUploader = function(options) {
        // fix options object
        options = options || [];
        options.el = options.el || "";
        options.noFileText = options.noFileText || "No file selected";
        options.buttonText = options.buttonText || "Choose File";

        // save otions
        this.el = $(options.el);
        this.noFileText = options.noFileText;
        this.buttonText = options.buttonText;

        this.init();

        return this;
    };
    /**
     * Init method used to apply necessary classes and build proper HTML structure
     */
    FileUploader.prototype.init = function() {
        if (this.el.length > 0) {
            // build proper HTML structure
            var wrapper = $("<div/>").addClass("file-upload-wrapper"),
                label = $("<label/>").addClass("file-upload-label"),
                info = $("<label/>").addClass("file-upload-info");

            wrapper.append(info, label);
            this.el.after(wrapper);
            label.append(this.el);
            info.attr("for", this.el.attr("id"));
            this.info = info;
            this.wrapper = wrapper;

            // apply wordings
            label.append(this.buttonText);
            this.updateFilename();

            // attach al events
            this.attachEvents();
        }
    };
    /**
     * Has File function used to check if file was selected or not
     */
    FileUploader.prototype.hasFile = function() {
        var path = this.el.val();
        return (path !== null && path !== '');
    };
    /**
     * Get File Name function used to
     */
    FileUploader.prototype.getFilename = function() {
        return this.el.val().split('\\').pop();
    };
    /**
     * Attach Event method used to attach all necessary events
     */
    FileUploader.prototype.attachEvents = function() {
        var self = this;

        // handle changing of file
        self.el.on("change", function() {
            self.updateFilename.call(self);
        });
    };
    /**
     * Update Filename method used to update widget filename label based on origin input
     */
    FileUploader.prototype.updateFilename = function() {
        if (this.hasFile()) {
            this.info.html( this.getFilename() );
        } else {
            this.info.html( this.noFileText );
        }
    };

    return FileUploader;
})(window.jQuery);


// -- window.UICore.Switcher
window.UICore.Switcher = (function($) {
    var Switcher = function(options) {
        // fix options object
        options.el = $(options.el || "");
        options.animationSpeed = options.animationSpeed || 200;

        // save options
        this.el = options.el;
        this.animationSpeed = options.animationSpeed;

        this.init();
    };
    Switcher.prototype.init = function() {
        if (this.el.length > 0) {
            var wrapper = $("<label/>").addClass("switch-wrapper"),
                toggler = $("<div/>").addClass("switch-toggler"),
                toggleWrapper = $("<div/>").addClass("switch-toggle-wrapper"),
                onLabel = $("<span/>").addClass("switch-label-on").html("On"),
                offLabel = $("<span/>").addClass("switch-label-off").html("Off");

            // check for source input state
            if (this.el.is(":checked")) {
                wrapper.addClass("state-on");
                toggler.css("margin-left", "30px");
            } else {
                wrapper.addClass("state-off");
                toggler.css("margin-left", "0");
            }

            // hide source element
            this.el.hide();

            toggleWrapper.append(toggler);
            wrapper.append(offLabel, toggleWrapper, onLabel);

            this.newEl = wrapper;
            this.el.after(this.newEl);
            this.toggler = toggler;

            this.attachEvents();
        }
    };
    Switcher.prototype.attachEvents = function() {
        var self = this;

        self.el.on("change", function() {
            if (self.el.is(":checked") !== self.newEl.hasClass("state-on")) {
                self.newEl.trigger("toggle");
            }
        });

        self.newEl.on("click", function() {
            self.newEl.trigger("toggle");
        });

        self.newEl.on("toggle", function() {
            var isOn = self.newEl.hasClass("state-on");
            if (isOn) {
                // turn OFF
                self.toggler.animate({
                    marginLeft: "0"
                }, self.animationSpeed, function() {
                    // animation completed here
                    self.newEl.removeClass("state-on");
                    self.newEl.addClass("state-off");
                    self.el.prop("checked", false);
                });
            } else {
                // turn ON
                self.toggler.animate({
                    marginLeft: "30px"
                }, self.animationSpeed, function() {
                    // animation completed here
                    self.newEl.removeClass("state-off");
                    self.newEl.addClass("state-on");
                    self.el.prop("checked", true);
                });
            }
        });
    };

    return Switcher;
})(window.jQuery);


// more widgets here...