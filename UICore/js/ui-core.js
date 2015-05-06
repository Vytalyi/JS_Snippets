/*
	This script contains all necessary UI components that are shared across all
	pages within PIM Supplier Portal website.

	Content:
	-- window.TP.UICore.Checkbox
	-- window.TP.UICore.Dropdown
	-- window.TP.UICore.SupplierSearch
	-- window.TP.UICore.AttributeSearch
	-- window.TP.UICore.JTabs
	-- window.TP.UICore.FileUploader
	-- window.TP.UICore.Switcher
	-- window.TP.UICore.CategorySelector
	-- window.TP.UICore.renderTPDropdowns()
	-- window.TP.UICore.renderTPCheckboxes()
	-- window.TP.UICore.renderTPFileUploaders()
*/
window.TP = window.TP || {};
window.TP.UICore = window.TP.UICore || {};


// -- window.TP.UICore.Checkboxs
window.TP.UICore.Checkbox = (function($) {
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


// -- window.TP.UICore.Dropdown
window.TP.UICore.Dropdown = (function($) {
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
        options.width = options.width || "245px";
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
			if (self.getValue() !== options.value) {
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
                var curDropdown = $(".dropdown ul:not(.closed)"),
					timer;
                if (curDropdown.length > 0) {
                    clearTimeout(timer);
                    timer = setTimeout(function() {
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


// -- window.TP.UICore.SupplierSearch
window.TP.UICore.SupplierSearch = (function($) {
	/**
	 * Supplier Search constructor function
	 * options.el {String} Contains jQuery selector of text input which is supposed to search by specific supplier
	 * options.autocompleteUrl {String} Contains Url for getting autocomplete data
	 * options.autocompleteMethod {String} Contains request type for getting autocomplete data
	 * options.autocompletePlaceholder {String} Contains placeholder text for search field
	*/
	var SupplierSearch = function(options) {
		// fix options object
		options = options || {};
		options.el = options.el || "";
		options.autocompleteUrl = options.autocompleteUrl || "/";
		options.autocompleteMethod = options.autocompleteMethod || "POST";
		options.autocompletePlaceholder = options.autocompletePlaceholder || "";

		// save options
		this.el = $(options.el);
		this.autocompleteUrl = options.autocompleteUrl;
		this.autocompleteMethod = options.autocompleteMethod;
		this.autocompletePlaceholder = options.autocompletePlaceholder;
		this.autocompleteMaxItems = options.autocompleteMaxItems || 20;

		// initialize
		this.init();

		return this;
	};
	/**
	 * Init method used to build proper HTML structure
	*/
	SupplierSearch.prototype.init = function() {
		var wrapper = $("<div/>").addClass("supplier-search"),
			searchIcon = $("<span/>").addClass("supplier-search-icon");

		// styling
		this.el.addClass("supplier-search-input").attr({
			placeholder: this.autocompletePlaceholder,
			autocomplete: "off"
		});

		// build html
		this.el.wrap(wrapper).after(searchIcon);

		this.initAutocomplete();
	};
	/**
	 * Initialize Autocomplete method used to add autocomplete functionality to text input
	*/
	SupplierSearch.prototype.initAutocomplete = function() {
		var self = this;

		this.el.autocomplete({
			appendTo: "body",
			source: function(request, response) {
				$.ajax({
					type: self.autocompleteMethod,
					url: self.autocompleteUrl,
					data: { search: request.term },
					dataType: "json",
					success: function(responseData) {
						autocompleteArr = [];

						$.each(responseData, function(i, obj) {
							var supplierName = obj.name, supplierCode = obj.code;
							autocompleteArr.push({
								text: supplierName,
								code: supplierCode
							});
						});

						// autocomplete Array is ready here - show first 20 matches
						response(autocompleteArr.slice(0, self.autocompleteMaxItems));
					}
				});
			},
			minLength: 0,
			select: function() { /* on item selected */ }
		})
		.autocomplete("instance")._renderItem = function( ul, item ) {
			// customize output
			var rtnEl = $("<li/>");
			rtnEl.append("<a href=" + item.code + ">" + item.text + "</a>");
            ul.addClass("supplier-autocomplete");
			return rtnEl.appendTo(ul);
		};
	};
	/**
	 * Close All method used to close all currently opened components on page
	*/
	SupplierSearch.prototype.closeAll = function(e) {
		var clickWithinContent = $(e.target).parents(".dropdown-search-content").length === 1;

		if (!clickWithinContent) {
			$(".dropdown-search-content:not(.closed)").each(function() {
				$(this).addClass("closed");
			});
		}
	};

	return SupplierSearch;
})(window.jQuery);


// -- window.TP.UICore.AttributeSearch
window.TP.UICore.AttributeSearch = (function() {
    /**
	 * Attribute Search constructor function
	 * options.el {String} Contains jQuery selector of text input which is supposed to search by specific supplier
	 * options.autocompleteUrl {String} Contains Url for getting autocomplete data
	 * options.autocompleteMethod {String} Contains request type for getting autocomplete data
	 * options.autocompletePlaceholder {String} Contains placeholder text for search field
     * options.changeHandler {Function} Contains function to call on autocomplete changing
     * options.selectHandler {Function} Contains function to call on autocomplete selecting
	*/
    var AttributeSearch = function(options) {
		// fix options object
		options = options || {};
		options.el = options.el || "";
		options.autocompleteUrl = options.autocompleteUrl || "/pimsupplierportal/metadata/taxonomy/getAttributes";
		options.autocompleteMethod = options.autocompleteMethod || "GET";
		options.autocompletePlaceholder = options.autocompletePlaceholder || "Enter attribute name";
        options.changeHandler = options.changeHandler || function() {};
        options.selectHandler = options.selectHandler || function() {};

		// save options
		this.el = $(options.el);
		this.autocompleteUrl = options.autocompleteUrl;
		this.autocompleteMethod = options.autocompleteMethod;
		this.autocompletePlaceholder = options.autocompletePlaceholder;
		this.autocompleteMaxItems = options.autocompleteMaxItems || 20;
        this.changeHandler = options.changeHandler;
        this.selectHandler = options.selectHandler;

		// initialize
		this.init();

		return this;
	};
    /**
	 * Init method used to build proper HTML structure
	*/
    AttributeSearch.prototype.init = function() {
		var wrapper = $("<div/>").addClass("attribute-search"),
			searchIcon = $("<span/>").addClass("attribute-search-icon");

		// styling
		this.el.addClass("attribute-search-input").attr({
			placeholder: this.autocompletePlaceholder,
			autocomplete: "off"
		});

		// build html
		this.el.wrap(wrapper).after(searchIcon);

		this.initAutocomplete();
	};
    /**
	 * Initialize Autocomplete method used to add autocomplete functionality to text input
	*/
    AttributeSearch.prototype.initAutocomplete = function() {
		var self = this;

		this.el.autocomplete({
			appendTo: "body",
            select: self.selectHandler,
            change: self.changeHandler,
			source: function(request, response) {
				$.ajax({
					type: self.autocompleteMethod,
					url: self.autocompleteUrl,
					data: { term: request.term },
					success: function(data) {
                        // show first 20 matches
						response($.map(data, function(item) {
                            item.label = item.name;
                            item.value = item.name;
                            item.usageDescription = item.usageDescription == null ? "" : item.usageDescription;
                            return item;
                        }).slice(0, self.autocompleteMaxItems));
					}
				});
			},
			minLength: 1
		})
		.autocomplete("instance")._renderItem = function( ul, item ) {
			// customize output
			var li = $("<li/>").append(
                $("<a/>").append(
                    $("<span/>").html(item.name + "&nbsp(" + item.code + ")&nbsp-&nbsp;"),
                    $("<span/>").addClass("grey").html(item.catalogId + " " + item.catalogVersionName)
                )
            );
            ul.addClass("attribute-autocomplete");
            return li.appendTo(ul);
		};
	};

    return AttributeSearch;
})(window.jQuery);


// -- window.TP.UICore.JTabs
window.TP.UICore.JTabs = (function($) {
    /**
     * Customized JQuery Tabs constructor function
     * options.el {String} Contains jQuery selector of tabs holder
     * options.active {String} Contains index of active tab (if no index - get it from URL parameter)
     * options.content {String} Contains jQuery selector of content to be appended to active tab
     */
    var JTabs = function(options) {
        // fix options object
        options = options || {};
        options.el = options.el || "#tabs";
        options.active = options.active || 0;
        options.content = options.content || "";

        // save options
        this.el = $(options.el);
        this.content = $(options.content);
        this.active = options.active;
        this.disabled = [];

        // initialize
        this.init();

        return this;
    };
    /**
     * Init method used to run jQuery tabs method with optional necessary parameters
     * also disable all tabs except of those one which is currently active
     */
    JTabs.prototype.init = function() {
        var self = this;

        if (self.el.length > 0) {
            self.length = self.el.find("> div").length;

            // set all tabs to disabled except of active
            for (var i=0; i<self.length; i++) {
                if (i !== self.active) {
                    self.disabled.push(i);
                }
            }

            // call jQuery tabs method
            self.el.tabs({
                active: self.active,
                disabled: self.disabled
            });

            // put content into currently active tab
            self.el.find("> div").eq(self.active).append(self.content);

            self.attachEvents();
        }
    };
    /**
     * Attach Event method used to attach all necessary events
     */
    JTabs.prototype.attachEvents = function() {
        var self = this;

        // go to specific URL on tab click
        self.el.find("> ul li a").on("click", function() {
            var url = $(this).attr("data-url");

            if (url) {
                window.location.href = url;
            }
        });
    };
    /**
     * Activate method used to activate tab with specific index
     * index {Number} Index of tab to activate
     */
    JTabs.prototype.activate = function(index) {
        self.el.tabs( "option", "active", index );
    };

    return JTabs;
})(window.jQuery);


// -- window.TP.UICore.ButtonsGroup
window.TP.UICore.ButtonsGroup = (function($) {
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
window.TP.UICore.FileUploader = (function($) {
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


// -- window.TP.UICore.Switcher
window.TP.UICore.Switcher = (function($) {
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


// -- window.TP.UICore.CategorySelector
window.TP.UICore.CategorySelector = (function($) {
	var CategorySelector = function(options) {
		options.catalogEl = $(options.catalogEl || "");
		options.events = options.events || {};
		options.events.rendered = options.events.rendered || function() {};
		options.catalogAjaxUrl = options.catalogAjaxUrl || "/pimsupplierportal/productDownload/categoryselector/loadCategoryData";
		options.defaultCatalog = options.defaultCatalog || "";
		options.showProductsAmount = options.showProductsAmount || false;
		options.quickSearchEnabled = options.quickSearchEnabled || false;
		options.quickSearchOptions = options.quickSearchOptions || {};
		options.quickSearchOptions.el = $(options.quickSearchOptions.el || "");
		options.quickSearchOptions.autocompleteUrl = options.quickSearchOptions.autocompleteUrl || "/pimsupplierportal/productDownload/categoryselector/getCategoryIdentifiersSuggest";
		options.quickSearchOptions.categoryReferencesUrl = options.quickSearchOptions.categoryReferencesUrl || "/pimsupplierportal/productDownload/categoryselector/getCategoryHierarchy";
		options.quickSearchOptions.errorEl = $(options.quickSearchOptions.errorEl || "#error");
		options.quickSearchOptions.invalidMessage = options.quickSearchOptions.invalidMessage || "ERROR, Please select a valid category or leave blank for full catalogue download";

		this.catalogEl =  options.catalogEl;
		this.defaultCatalog = options.defaultCatalog;
		this.showProductsAmount = options.showProductsAmount;
		this.catalogAjaxUrl = options.catalogAjaxUrl;
		this.quickSearchEnabled = options.quickSearchEnabled;
		this.quickSearchOptions = options.quickSearchOptions;
		this.invalidQuickSearch = false;
		this.events = options.events;

		this.currentCatalog = this.getDefaultCatalog();
		this.currentCategories = this.getCategoriesFromHash();

		this.rowTemplate = '' +
			'<div class="form-field">' +
				'<label for="{dropdownId}">{labelText}:</label>' +
				'<select id="{dropdownId}" class="{dropdownClassname}">' +
					'<option value="">Please choose a category...</option>' +
					'{dropdownOptions}' +
				'</select>' +
			'</div>';
		this.optionTemplate = '<option value="{value}" {selectedAttr}>{text}</option>';

		this.init();
		if (this.quickSearchEnabled) {
			this.initQuickSearch();
		}

		return this;
	};
	CategorySelector.prototype.init = function() {
		if (this.catalogEl) {
			var wrapper = $("<div/>").addClass("category-selector"),
				catalogWrapper = $("<div/>").addClass("catalog-wrapper"),
				categoriesWrapper = $("<div>").addClass("categories-wrapper");

			// build necessary structure
			this.catalogEl.parent().after(wrapper);
			catalogWrapper.append(this.catalogEl.parent());
			wrapper.append(catalogWrapper, categoriesWrapper);

			this.wrapper = wrapper;
			this.catalogWrapper = catalogWrapper;
			this.categoriesWrapper = categoriesWrapper;

			this.catalogEl.val(this.currentCatalog);
			if (!this.catalogEl.val()) {
				this.catalogEl.val("downstreamCatalog." + this.currentCatalog);
			}

			this.attachEvents();
			this.loadCategoryDataList();
		}
	};
	CategorySelector.prototype.attachEvents = function() {
		var self = this;

		// changing of Catalog
		self.catalogEl.on("change", function(e) {
			var target = $(e.target);

			// update current catalog and category codes
			self.currentCatalog = target.val().replace(/downstreamCatalog[.]/g, "");
			self.categoriesWrapper.empty();

			self.updateCategoryCodes.call(self);
			self.setUrlHash(self.currentCatalog);

			self.quickSearchOptions.el.val("");
			self.invalidQuickSearch = false;
			self.setQuickSearchErrorState.call(self, false);
			self.setErrorMessage("");
		});

		// changing of Category
		self.categoriesWrapper.on("change", "select", function(e) {
			var target = $(e.target);

			// update category codes
			self.updateCategoryCodes.call(self, target);

			var urlhash = [self.currentCatalog].concat(self.currentCategories);
			self.setUrlHash(urlhash.join(","));

			self.quickSearchOptions.el.val("");
			self.invalidQuickSearch = false;
			self.setQuickSearchErrorState.call(self, false);
			self.setErrorMessage("");
		});

		if (window.onpopstate) {
			window.onpopstate = function () {
				self.loadCategoryDataList.call(self);
			};
		} else {
			window.onhashchange = function() {
				self.loadCategoryDataList.call(self);
			};
		}
	};
	CategorySelector.prototype.updateCategoryCodes = function(selectedCategoryElement) {
		var self = this;
		self.currentCategories = [];
		self.categoriesWrapper.find("select").each(function() {
			var selectedValue = $(this).val();
			if (selectedValue !== "") {
				self.currentCategories.push(selectedValue);
			}
			if (selectedCategoryElement && selectedCategoryElement.val() === $(this).val()) {
				// once we've reached target element/category - all next elements should be removed
				selectedCategoryElement.parent().nextAll().each(function() {
					$(this).remove();
				});
				return false;
			}
		});
	};
	CategorySelector.prototype.getCategoriesFromHash = function() {
		var arr = window.location.hash.split(",");
		if (arr.length < 2) {
			return [];
		}
		return window.location.hash.split(",").splice(2);
	};
	CategorySelector.prototype.getDefaultCatalog = function() {
		var arr = window.location.hash.split(",");
		if (arr.length > 1) {
			return arr[1];
		}
		return this.defaultCatalog || this.catalogEl.val().replace(/downstreamCatalog[.]/g, "");
	};
	CategorySelector.prototype.setUrlHash = function(urlHash) {
		window.location.href = "#," + urlHash;
	};
	CategorySelector.prototype.loadCategoryDataList = function() {
		var self = this;

		$.ajax({
			type: "post",
			url: self.catalogAjaxUrl,
			data: {
				"catalogId": self.currentCatalog,
				"categoryIds": self.currentCategories.join(",")
			},
			success: function(data) {
				self.categoriesWrapper.empty();
				$(data).each(function(i, item) {
					var number = (i+1),
						options = self.buildOptions(this, number, self),
						newRowHtml = self.rowTemplate
							.replace(/{labelText}/g, "Category " + number)
							.replace(/{dropdownId}/g, "category" + number)
							.replace(/{dropdownClassname}/g, "categorySelector")
							.replace(/{dropdownOptions}/g, options);
					if (options) {
						self.categoriesWrapper.append(newRowHtml);
					}
				});
				// do not show quick search if no categories for that catalog
				if (data[0] && data[0].length === 0) {
					$(self.quickSearchOptions.el).parent().hide();
				} else {
					$(self.quickSearchOptions.el).parent().show();
				}
				self.events.rendered.call(self);
			},
			error: function() {
				self.categoriesWrapper.empty();
			}
		});
	};
	CategorySelector.prototype.buildOptions = function(jsonObj, number, context) {
		var options = [], opt;
		for (var prop in jsonObj) {
			if (jsonObj.hasOwnProperty(prop)) {
				opt = jsonObj[prop];
				options.push(context.optionTemplate
					.replace(/{value}/g, opt.categoryCode)
					.replace(/{text}/g, opt.categoryName + (context.showProductsAmount && opt.amountOfProducts !== null ? " (" + opt.amountOfProducts + ")" : "") )
					.replace(/{selectedAttr}/g, (context.currentCategories[(number-1)] === opt.categoryCode ? 'selected="selected"' : ''))
				);
			}
		}
		return options.join("");
	};
	CategorySelector.prototype.initQuickSearch = function() {
		var el = this.quickSearchOptions.el,
			quickSearchWra = $("<div/>").addClass("quicksearch-wrapper");
		if (el.length > 0) {
			quickSearchWra.append(el.parent());
			this.catalogWrapper.after(quickSearchWra);
			el.addClass("category-quick-search");
			el.attr("placeholder", "Enter category name or code");
			this.attachQuickSearchEvents();
		}
	};
	CategorySelector.prototype.attachQuickSearchEvents = function() {
		var self = this,
			el = self.quickSearchOptions.el;

		el.autocomplete({
			appendTo: "body",
			source: function(request, response) {
				$.ajax({
					type: "get",
					url: self.quickSearchOptions.autocompleteUrl,
					data: {
						catalogId: self.currentCatalog,
						identifierPart: el.val()
					},
					success: function(jsonObj) {
						response(jsonObj);

						// select automatically with a little delay if only 1 item were suggested
						if (jsonObj.length === 1) {
							setTimeout(function() {
								el.val(jsonObj[0]).trigger("blur");
								self.invalidQuickSearch = false;
								self.buildSelectionByCategory(self.currentCatalog, el.val().replace(/[^\d]/g, ""));
								self.setQuickSearchErrorState.call(self, false);
							}, 500);
						}
					}
				});
			},
			select: function(event, ui) {
				var catalog = self.currentCatalog,
					category = ui.item.value.replace(/[^\d]/g, "");

				self.buildSelectionByCategory(catalog, category);
				self.invalidQuickSearch = false;
				self.setQuickSearchErrorState.call(self, false);
			},
			change: function(event, ui) {
				if ($(this).val() === "") {
					// selection is valid/ignored if no quick search string provided
					self.setQuickSearchErrorState.call(self, false);
					self.invalidQuickSearch = false;
					self.setErrorMessage("");
				}
				else if (ui && !ui.item) {
					// if not from suggestions - do not allow that input
					self.currentCategories = [];
					self.setUrlHash(self.currentCatalog);
					self.setQuickSearchErrorState.call(self, true);
					self.invalidQuickSearch = true;
				}
			},
			minLength: 1
		}).autocomplete( "widget" ).addClass( "quick-search-autocomplete" );

		// prevent containing form from submitting in case of invalid QuickSearch selection
		el.parents("form").on("submit", function() {
			if (catSel.invalidQuickSearch) {
				self.setErrorMessage(self.quickSearchOptions.invalidMessage);
				self.setQuickSearchErrorState.call(self, true);
				el.focus();
				return false;
			}
		});

		// prevent buttons dropdown to be expanded (if no buttons dropdown on page - do nothing)
		el.parents("form").find("a.btn-cta").on("click", function() {
			if (catSel.invalidQuickSearch) {
				self.setErrorMessage(self.quickSearchOptions.invalidMessage);
				self.setQuickSearchErrorState.call(self, true);
				el.focus();

				$(this).next("ul").addClass("expanded");

				return false;
			}
		});
	};
	CategorySelector.prototype.buildSelectionByCategory = function(catalogId, categoryId) {
		var self = this;
		$.ajax({
			type: "get",
			url: self.quickSearchOptions.categoryReferencesUrl,
			data: {
				catalogId: catalogId,
				categoryCode: categoryId
			},
			success: function(categoriesString) {
				self.currentCategories = categoriesString.split(",");
				self.setUrlHash(self.currentCatalog + "," + categoriesString);
			},
			error: function() {
				self.quickSearchOptions.el.val("");
			}
		});
	};
	CategorySelector.prototype.setErrorMessage = function(msg) {
		var el = $(this.quickSearchOptions.errorEl);
		if (el.length > 0) {
			el.html(msg);
		}
	};
	CategorySelector.prototype.setQuickSearchErrorState = function(isError) {
		var el = $(this.quickSearchOptions.el);
		if (isError) {
			el.addClass("error");
		} else {
			el.removeClass("error");
		}
	};

	return CategorySelector;
})(window.jQuery);


// -- window.TP.UICore.renderTPDropdowns
window.TP.UICore.renderTPDropdowns = (function($) {
    /**
     * Helper method used to initialize custom dropdowns
     * filterString {String} string to pass into jQuery filter function
     */
    return function(options) {
        options = options || {};
        options.filter = options.filter || ":not(.hidden)";

        var elements = $("select:not(.processed)");
        if (options.filter) {
            elements = elements.filter(options.filter);
        }

        elements.each(function() {
            var el = new TP.UICore.Dropdown({
                el: this
            });
        });
    };
})(window.jQuery);


// -- window.TP.UICore.renderTPCheckboxes
window.TP.UICore.renderTPCheckboxes = (function($) {
    /**
     * Helper method used to initialize custom checkboxes
     * filterString {String} string to pass into jQuery filter function
     */
    return function(options) {
        options = options || {};
        options.filter = options.filter || ":not(.hidden)";

        var elements = $("input[type=checkbox]");
        if (options.filter) {
            elements = elements.filter(options.filter);
        }

        elements.each(function() {
            var el = new TP.UICore.Checkbox({
                el: this
            });
        });
    };
})(window.jQuery);


// -- window.TP.UICore.renderTPFileUploaders
window.TP.UICore.renderTPFileUploaders = (function($) {
    /**
     * Helper method used to initialize custom file upload components
     * filterString {String} string to pass into jQuery filter function
     */
    return function(options) {
        options = options || {};
        options.filter = options.filter || ":not(.hidden)";

        var elements = $("input[type=file]");
        if (options.filter) {
            elements = elements.filter(options.filter);
        }

        elements.each(function() {
            var el = new TP.UICore.FileUploader({
                el: this
            });
        });
    };
})(window.jQuery);


// more widgets here...
