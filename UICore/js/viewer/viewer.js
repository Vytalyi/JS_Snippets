window.TP = window.TP || {};
window.TP.UICore = window.TP.UICore || {};

window.TP.UICore.TemplateViewerNew = (function ($) {
	var Viewer = function (options) {
		this.parseOptions(options);
		this.initialize();

		return this;
	};
	Viewer.prototype.parseOptions = function (options) {
		options = options || {};
		options.el = $(options.el || "");
		options.dataUrl = options.dataUrl || "/pimsupplierportal/static/js/viewer/ajaxdata2.json";
		options.data = options.data || null;
		options.defaults = options.defaults || {};
		options.defaults.columnWidth = options.defaults.columnWidth || 100;
		options.defaults.showOldColumns = false;
		options.defaults.scrollStep = 50;

		this.el = options.el;
		this.dataUrl = options.dataUrl;
		this.data = options.data;
		this.defaults = options.defaults;
	};
	Viewer.prototype.initialize = function () {
		this.buildHTML();
		this.attachScrollSyncEvents();
		this.attachColumnSwitcherEvents();
		this.attachWindowResizeEvents();
		this.attachDataEditEvents();
		this.attachColumnResizeEvents();
		this.attachContextMenuEvents();
		this.attachSearchDialogEvents();
		this.attachKeyboardHoyKeyEvents();
		this.attachSortingEvents();
		this.loadData(function () {
			this.render();
		});
	};
	Viewer.prototype.attachScrollSyncEvents = function () {
		var self = this,
			scrollbarHorizontal = $(".tbl-data-scroll-horizontal"),
			scrollbarVertical = $(".tbl-data-scroll-vertical > div");

		scrollbarHorizontal.on("scroll", function () {
			var l = scrollbarHorizontal.scrollLeft();
			self.tblFixedRow.parent().scrollLeft(l);
			self.tblData.parent().scrollLeft(l);
		});
		scrollbarVertical.on("scroll", function () {
			var t = scrollbarVertical.scrollTop();
			self.tblFixedColumn.parent().scrollTop(t);
			self.tblData.parent().scrollTop(t);
		});
		self.tblData.parent().on("mousewheel", function (e) {
			var delta = e.originalEvent.wheelDelta,
				t = scrollbarVertical.scrollTop();
			if (delta / 120 > 0) {
				t -= self.defaults.scrollStep;
			} else {
				t += self.defaults.scrollStep;
			}
			scrollbarVertical.scrollTop(t);
			scrollbarVertical.trigger("scroll");
		});
	};
	Viewer.prototype.attachColumnSwitcherEvents = function () {
		var self = this, i, j, displayOldColumn, isAnyShown, closeOldColumns,
			switchSelectColumns, selectNothing;

		closeOldColumns = function (isSelection) {
			var item;
			for(j = 0; j < self.data.columns.length; j++) {
				item = self.data.columns[j];
				// if processing columns in selection range filter not selected column
				if (isSelection && item.selectedColumn) {
					item.customIsOldColumnVisible = false;
					displayOldColumn(item);
				}
				// processing old column without selection
				else if (!isSelection) {
					item.customIsOldColumnVisible = false;
					displayOldColumn(item);
				}
			}
		};

		displayOldColumn = function (col) {
			var id = '.' + col.id;

			if(col.customIsOldColumnVisible) {
				$(".old" + id).filter(":not(:visible)").show();
				// add old column width when it's be shown
				self.tblData.find(".old" + id).css("width", col.customWidthOld - 2);
				self.tblFixedRow.find(".old" + id).css("width", col.customWidthOld);
			} else {
				$(".old" + id).filter(":visible").hide();
			}
		};

		switchSelectColumns = function () {
			var t = null;
			selectNothing = true;
			isAnyShown = false;

			for (i = 0; i < self.data.columns.length; i++) {
				t = self.data.columns[i];

				if (!t.selectedColumn) {
					continue;
				}
				selectNothing = false;

				if(t.customIsOldColumnVisible) {
					closeOldColumns(true);
					isAnyShown = false;
					break;
				} else {
					isAnyShown = true;
					t.customIsOldColumnVisible = true;
					displayOldColumn(t);
				}
			}

			if (selectNothing) {
				for (i = 0; i < self.data.columns.length; i++) {
					t = self.data.columns[i];
					if(t.customIsOldColumnVisible) {
						closeOldColumns();
						isAnyShown = false;
						break;
					} else {
						isAnyShown = true;
						t.customIsOldColumnVisible = true;
						displayOldColumn(t);
					}
				}
			}
			// change hide/show button status
			isAnyShown ? self.changeBtnStatus(isAnyShown) : self.changeBtnStatus(isAnyShown);
			self.attachInlineStyles();
		};

		$('.column-switcher').on("click", switchSelectColumns);
	};
	Viewer.prototype.attachWindowResizeEvents = function () {
		var self = this,
			debouncedFnCall = debounce(function () {
				self.attachInlineStyles.call(self);
			}, 200);
		$(window).on("resize", function () {
			debouncedFnCall();
		});
	};
	Viewer.prototype.buildHTML = function () {
		var self = this;
		if (self.el.length > 0) {
			$(Viewer.prototype.btnHolder).insertBefore(self.el);
			self.el.addClass("template-viewer").append(Viewer.prototype.gridTemplateHTML);
			self.el.before(Viewer.prototype.contextMenuTemplate, Viewer.prototype.searchAndReplaceDialog);
			self.tblFixedColumn = self.el.find(".tbl-fixed-column");
			self.tblFixedRow = self.el.find(".tbl-fixed-row");
			self.tblData = self.el.find(".tbl-data");
			self.searchDialog = self.el.prev();
			self.contextMenu = self.searchDialog.prev();
		}
	};
	Viewer.prototype.loadData = function (callback) {
		var self = this;

		function endLoading() {
			self.el.removeClass("loading");
		}

		if (!self.data) {
			$.ajax({
				url: self.dataUrl + "?r=" + (new Date().getTime()),
				type: "post",
				dataType: "json",
				complete: endLoading.bind(self),
				success: function (data) {
					self.data = data;
					callback.call(self, data);
				}
			});
		} else {
			callback.call(self, self.data);
			endLoading.call(self);
		}
	};
	Viewer.prototype.render = function () {
		var columns = this.data.columns,
			rows = this.data.items,
			iframeWdth = this.el.width(),
			fixedColWidth,
			i, j, c, r, valObj,
			tblFixedRow = "",
			tblFixedColumn = "",
			tblData = "";

		$('.btn-holder').show();
		for (i = 0; i < columns.length; i++) {
			c = columns[i];

			// extend column with custom properties
			c.customIsOldColumnVisible = c.customIsOldColumnVisible === undefined ? this.showOldColumns : c.customIsOldColumnVisible;
			c.customWidthNew = c.customWidthNew || this.defaults.columnWidth;
			c.customWidthOld = c.customWidthOld || this.defaults.columnWidth;
			// set biggest columns width if summary columns width less then iframe width. | 50 - scroll width, 15 - cell padding, 100 - ID column width
			if(iframeWdth > c.customWidthNew * columns.length) {
				fixedColWidth = fixedColWidth || ( (iframeWdth - 50 - 100) - 15 * columns.length ) / columns.length ;
				c.customWidthNew = fixedColWidth;
			}
			tblFixedRow += '<th class="new {columnId}" data-column="{columnId}" title="{content}" style="width:{newColWidth}">{content} {resizer}</th><th class="old {columnId}" data-column="{columnId}" title="{content}" style="display: none">Old {content} {resizer}</th>'
				.replace(/{content}/gm, c.displayName)
				.replace(/{columnId}/gm, c.id)
				.replace(/{newColWidth}/gm, c.customWidthNew + 'px')
				.replace(/{resizer}/gm, this.columnResizerTemplateHtml);
		}

		for (i = 0; i < rows.length; i++) {
			r = rows[i];

			tblFixedColumn += '<tr><th>{id}</th></tr>'
				.replace(/{id}/g, r.id);

			tblData += '<tr id="{id}">'.replace(/{id}/g, r.id);
			for (j = 0; j < columns.length; j++) {
				valObj = r[columns[j].id];

				tblData += '<td class="new {columnId} {isModified}" style="width:{newColWidth}">{newValue}</td><td class="old {columnId}" style="display: none">{oldValue}</td>'
					.replace(/{columnId}/gm, columns[j].id)
					.replace(/{oldValue}/gm, valObj.oldValue)
					.replace(/{newValue}/gm, valObj.newValue)
					.replace(/{newColWidth}/gm, c.customWidthNew + 'px')
					.replace(/{isModified}/gm, valObj.oldValue === valObj.newValue ? "" : "modified");
			}
			tblData += '</tr>';
		}
		this.tblFixedRow.html("<tr>" + tblFixedRow + "</tr>");
		this.tblFixedColumn.html(tblFixedColumn);
		this.tblData.html(tblData);
		this.attachInlineStyles();
		this.attachColumnSelector();
	};
	Viewer.prototype.attachInlineStyles = function () {
		var cellPadding = 18,
			maxHeight = $(document.body).height() - 180,
			c, fullWidth = 0, wNew, wOld,
			verticalScrollOffset;

		verticalScrollOffset = function () {
			var grid_width = $('.grid').outerWidth(true),
				leftCol_width = $('.column-one').outerWidth(true),
				tblData_width = $('.tbl-data').outerWidth(true),
				scrollBar = 20, offset;

			offset = grid_width - leftCol_width - tblData_width - scrollBar;

			return offset < 0 ? 0 : offset;
		};

		// process tables and its wrappers
		this.tblData.parent().css({
			maxHeight: maxHeight
		});
		this.tblFixedColumn.parent().css({
			maxHeight: maxHeight
		});

		// process width of columns
		for (var i = 0; i < this.data.columns.length; i++) {
			c = this.data.columns[i];
			// process NEW column
			wNew = c.customWidthNew || this.defaults.columnWidth;
			fullWidth += (wNew + cellPadding + 2);

			if (c.customIsOldColumnVisible) {
				// process OLD column
				wOld = c.customWidthOld || this.defaults.columnWidth;
				fullWidth += (wOld + cellPadding);
			}
		}
		// process full width
		this.tblData.css("width", fullWidth);
		this.tblFixedRow.css("width", fullWidth);
		// process scrollbars
		this.el.find(".tbl-data-scroll-horizontal > div").css("width", fullWidth);
		this.el.find(".tbl-data-scroll-vertical > div").css("maxHeight", maxHeight);
		this.el.find(".tbl-data-scroll-vertical > div > div").css("height", this.tblData.height());

		// adding scrollbar offset
		this.el.find(".tbl-data-scroll-vertical > div").css("right", verticalScrollOffset());
	};
	Viewer.prototype.attachDataEditEvents = function () {
		var self = this,
			editor, cell, oldValue, addDataChanges;

		/**
		 * Get event context from and take column and rows id.
		 * Find this element in the data model and add changed data
		 * @param $context jQuery object
		 * @param data String
		 */
		addDataChanges = function ($context, data) {
			var colId = $context.parent().attr('class').split(' ')[1],
				rowId = $context.parent().parent().attr('id');

			for (var i = 0; i < self.data.items.length; i++) {

				if (self.data.items[i].id === rowId) {
					self.data.items[i][colId]["newValue"] = data;
				}
			}
		};

		self.tblData.on("click", "td.new:not(.cell-editing)", function (e) {
			cell = $(e.currentTarget);
			oldValue = cell.next().html();
			editor = $(self.cellEditorTemplateHTML.replace(/{val}/g, cell.html()));
			// reset column selection when user click on the cell
			self.resetColumnSelection();

			cell.addClass("cell-editing").html(editor);
			editor.focus();
			editor.on("keypress", function (e) {
				if (e.keyCode === 13) {
					editor.blur();
				}
			});
			editor.on("blur", function () {
				var newValue = editor.val();

				if (newValue !== oldValue) {
					cell.addClass("modified");
					addDataChanges($(this), newValue);
				} else {
					cell.removeClass("modified");
				}

				cell.removeClass("cell-editing search-selected").html(newValue);
				editor.remove();
			});
		});
	};
	Viewer.prototype.attachColumnResizeEvents = function () {
		var self = this,
			isDragging = false,
			defaultCellPadding = 16,
			minColumnWidth = 30,
			changeWidth = function (keyname, colId, newWidth) {
				newWidth = newWidth < minColumnWidth ? minColumnWidth : newWidth;
				self.getColumnById(colId)[keyname] = newWidth - 2;

				if(keyname === "customWidthNew") {
					self.tblData.find(".new" + '.' + colId).css("width", newWidth - 2);
					self.tblFixedRow.find(".new" + '.' + colId).css("width", newWidth);
				} else {
					self.tblData.find(".old" + '.' + colId).css("width", newWidth - 2);
					self.tblFixedRow.find(".old" + '.' + colId).css("width", newWidth);
				}
				self.attachInlineStyles();
			};
		return (function () {
			var el, colId;
			self.tblFixedRow.on("mousedown", ".column-resizer", function (e) {
				if (e.which === 1) {
					isDragging = true;
					el = $(e.target);
					el.addClass("dragging");
					el.css("left", e.clientX);
					colId = el.parents("th").attr("data-column");
				}
			});
			$(document).on("mouseup", function (e) {
				if (isDragging) {
					isDragging = false;
					el.removeClass("dragging");
					el.css("left", "auto");

					changeWidth(
						el.parents("th").hasClass("new") ? "customWidthNew" : "customWidthOld",
						colId,
						e.clientX - $(e.target).parents("th").offset().left - defaultCellPadding
					);
				}
			});
			self.el.on("mousemove", function (e) {
				if (isDragging) {
					el.css("left", e.clientX);
				}
			});
		})();
	};
	Viewer.prototype.attachContextMenuEvents = function () {
		var self = this,
			contextMenuWidth = 220,
			columnType, showMenu,
			columnId;

		showMenu = function (e) {
			e.preventDefault();
			e.stopPropagation();
			columnId = $(e.target).attr("data-column");
			columnType = $(this).hasClass('old') ? 'oldValue' : 'newValue';

			var cssObj = {top: e.pageY};
			if (self.el.width() - e.pageX > contextMenuWidth) {
				cssObj.left = e.pageX;
				cssObj.right = "auto";
			} else {
				cssObj.left = "auto";
				cssObj.right = document.documentElement.clientWidth - e.pageX;
			}
			self.contextMenu.removeClass("closed");
			self.contextMenu.css(cssObj);
			self.contextMenu.data('column', columnId);
			self.contextMenu.data('columnType', columnType);
		};

		self.tblFixedRow.on("contextmenu", "th", showMenu);
		$('.corner-top-left').on("contextmenu", showMenu);

		$(document).on("click", function (e) {
			if ($(e.target).parents(".context-menu").length === 0) {
				self.contextMenu.addClass("closed");
			}
		});
		self.contextMenu.on("click", "li", function (e) {
			var key = $(e.target).attr("data-key");
			if (key) {
				self.contextMenu.addClass("closed");
				self.showDialog.call(self, key, columnId);
			}
		});
		// show dialog by click on search button
		$('.search-btn').on('click', function () {
			var searchAtEl = self.searchDialog.find("#searchAtTxt");

			self.searchDialog.find(".head .title").html("Find and replace");
			self.searchDialog.removeClass("closed").addClass('search-replace');

			$(document).one('keydown', function (e) {
				if (e.keyCode === 27) {
					self.searchDialog.addClass("closed");
				}
			});

			if (self.isAnyColumnSelected()) {
				searchAtEl.val('Selected columns');
				searchAtEl.attr("search-opt", "selected");
			} else {
				searchAtEl.val("All Columns");
				searchAtEl.attr("search-opt", "");
			}
		});
	};
	Viewer.prototype.getColumnById = function (columnId) {
		var res = null, c;
		for (var i = 0; i < this.data.columns.length; i++) {
			c = this.data.columns[i];
			if (c.id === columnId) {
				res = c;
				break;
			}
		}
		return res;
	};
	Viewer.prototype.attachSearchDialogEvents = function () {
		var self = this, findCell, replaceAll, searchTerm, replaceTerm, testRegExp,
			cellsToProceed = [];

		findCell = function () {
			var searchAtSelection = $("#searchAtTxt").attr("search-opt");
			searchTerm = $("#findTxt").val();
			testRegExp = new RegExp(searchTerm, 'i');
			self.resetSearchSelections.call(self);
			cellsToProceed = [];
			/**
			 * If any column selected searchAt will be true
			 */
			if (searchAtSelection) {
				var selectedColumn, res;

				for (var i = self.data.columns.length - 1; i >= 0; i--) {
					// filter only selected column and search on it
					if (!self.data.columns[i].selectedColumn) {
						continue;
					}
					selectedColumn = self.data.columns[i].id;
					res = self.tblData.find("td.new." + selectedColumn).filter(function (i, elem) {
						return testRegExp.test(elem.innerHTML);
					});
					cellsToProceed = $.merge(cellsToProceed, res);
				}
			} else {
				cellsToProceed = self.tblData.find("td.new").filter(function (i, elem) {
					return testRegExp.test(elem.innerHTML);
				});
			}
			// Scroll to first element in the search result
			self.scrollToFindCell(cellsToProceed[0]);
			$(cellsToProceed).addClass("search-result");
		};

		replaceAll = function () {
			searchTerm = $("#findTxt").val();
			replaceTerm = $("#replaceTxt").val();
			// Do nothing if search query doesn't exist
			if (!searchTerm) {
				return;
			}

			// Initiate search by user query
			findCell();

			$(cellsToProceed).each(function () {
				var cell = $(this),
					oldValue = cell.next().html(),
					newValue = cell.html();

				newValue = newValue.replace(new RegExp(searchTerm, 'gi'), replaceTerm);

				cell.html(newValue);
				cell.addClass("search-result");

				if (oldValue !== newValue) {
					cell.addClass("modified");
				} else {
					cell.removeClass("modified");
				}
			});
		};

		self.searchDialog.draggable({
			containment: "document"
		});

		self.searchDialog.on("click", ".close-lnk, .close-btn", function () {
			self.resetSearchSelections.call(self);
			self.resetColumnSelection();
			$("#findTxt").val('');
			$("#replaceTxt").val('');
			self.searchDialog.addClass("closed");
		});

		self.searchDialog.on("click", "#findAllBtn", findCell);

		self.searchDialog.on("click", "#replaceAllBtn", replaceAll);
	};
	Viewer.prototype.resetSearchSelections = function () {
		this.tblData.find("td.search-result").removeClass("search-result");
	};
	Viewer.prototype.attachSortingEvents = function () {
		var self = this, colId, sortFunc, sortValue,
			sortFlag = {
				'decrease': false,
				'increase': false,
				'lastSortedId': '',
				'currentSorted': ''
			};
		/**
		 * Get column id and type under the context menu shown
		 * @param $this jQuery object with sorting options
		 */
		var getOptions = function ($this) {
			sortFlag['currentSorted'] = colId = $this.closest('.context-menu').data('column');
			sortValue = $this.closest('.context-menu').data('columnType');
		};
		/**
		 * @param comparison String Describe sorting options
		 */
		var sortItems = function (comparison) {
			// configure sorting function
			if(comparison === 'increase') {
				sortFunc = (colId !== 'id') ?
					function (a, b) {
						return a[colId][sortValue].toLowerCase() > b[colId][sortValue].toLowerCase() ? 1 : -1;
					} :
					function (a, b) {
						return a[colId].toLowerCase() > b[colId].toLowerCase() ? 1 : -1;
					};
			} else {
				sortFunc = (colId !== 'id') ?
					function (a, b) {
						return a[colId][sortValue].toLowerCase() < b[colId][sortValue].toLowerCase() ? 1 : -1;
					} :
					function (a, b) {
						return a[colId].toLowerCase() < b[colId].toLowerCase() ? 1 : -1;
					};
			}
			self.data.items.sort(sortFunc);
			self.render();
		};

		$('.inc-order ').on('click tap', function () {
			getOptions($(this));

			if (sortFlag['lastSortedId'] !== sortFlag['currentSorted'] || !sortFlag['increase']) {
				sortItems('increase');
				sortFlag['increase'] = true;
				sortFlag['decrease'] = false;
				sortFlag['lastSortedId'] = sortFlag['currentSorted'];
			}
			self.contextMenu.addClass("closed");
		});

		$('.dsc-order').on('click tap', function () {
			getOptions($(this));

			if (sortFlag['lastSortedId'] !== sortFlag['currentSorted'] || !sortFlag['decrease']) {
				sortItems('decrease');
				sortFlag['increase'] = false;
				sortFlag['decrease'] = true;
				sortFlag['lastSortedId'] = sortFlag['currentSorted'];
			}
			self.contextMenu.addClass("closed");
		});

	};
	Viewer.prototype.changeBtnStatus = function (isAnyOldColShown) {
		var btn = $('.column-switcher'),
			WHEN_HIDE = 'View original',
			WHEN_SHOWN = 'Hide original';
		/**
		 * If any column in the selected range have related old value column's as visible
		 * Change hide/show button text on 'Hide original'
		 */
		isAnyOldColShown ? btn.text(WHEN_SHOWN) : btn.text(WHEN_HIDE);
	};
	Viewer.prototype.attachColumnSelector = function () {
		var self = this, i, t, findPos, addSelectionRange,
			lastSelectedPos, currentPos, colId, isAnyShown,
			$columnHeader = $('.tbl-fixed-row').find('.new');

		findPos = function (colId) {
			for (i = 0; i < self.data.columns.length; i++) {
				if (self.data.columns[i].id === colId) {
					return i;
				}
			}
		};

		addSelectionRange = function () {
			var min, maxColumnId;
			isAnyShown = false;

			if (lastSelectedPos < currentPos) {
				min = lastSelectedPos;
				maxColumnId = colId;
				colId = self.data.columns[min].id;
			} else {
				min = currentPos;
				maxColumnId = colId = self.data.columns[lastSelectedPos].id;
			}

			for (i = min; i < self.data.columns.length; i++) {
				t = self.data.columns[i];
				t.selectedColumn = true;
				isAnyShown = (t.customIsOldColumnVisible) ? true : isAnyShown;
				$columnHeader.filter("." + t.id).addClass('colSelected');
				$('.tbl-data').find("." + t.id).addClass('showSelection');

				if (t.id === maxColumnId) {
					break;
				}
			}
			// change hide/show button status
			isAnyShown ? self.changeBtnStatus(isAnyShown) : self.changeBtnStatus(isAnyShown);
		};

		self.tblFixedRow.on("click", "th", function (e) {
			isAnyShown = false;

			if (e.target.className === 'column-resizer' ||
				e.target.className.indexOf('old') !== -1) {
				return;
			}
			// don't select column when searchDialog shown
			if(!self.searchDialog.hasClass("closed")) {
				return;
			}

			colId = $(this).attr("data-column");
			currentPos = findPos(colId);

			if (!e.ctrlKey) {
				self.resetColumnSelection();
			}
			/**
			 *  addSelectionRange function will add all needed classes and change select state of elements in data model
			 *  so there is no need in  further click handler function processing
			 */
			if (e.shiftKey) {
				return addSelectionRange();
			}

			lastSelectedPos = findPos(colId);
			t = self.getColumnById(colId);
			t.selectedColumn = !t.selectedColumn;
			// Change status of hide/show button according to columns that selected by CTRL key
			if(e.ctrlKey){
				for (i = 0; i < self.data.columns.length; i++) {
					t = self.data.columns[i];
					// filter not select column
					if (!t.selectedColumn) {
						continue;
					}
					isAnyShown = (t.customIsOldColumnVisible) ? true : isAnyShown;
				}
				// change hide/show button status
				isAnyShown ? self.changeBtnStatus(isAnyShown) : self.changeBtnStatus(isAnyShown);
			} else {
				/**
				 * if CTRL key wasn't using that means the column select by click
				 * And if the column with old data shown change hide/show button status to 'Hide'
				 */
				isAnyShown = (t.customIsOldColumnVisible) ? true : false;
				self.changeBtnStatus(isAnyShown);
			}
			$('.tbl-data').find('.' + colId).toggleClass('showSelection');
			$(this).toggleClass('colSelected');
		});

		$(document).on('click', function (e) {
			var isClickOnTable = $(e.target).parents('.grid').length,
				isClickOnModalWindow = $(e.target).parents('#searchAndReplaceDialog').length;

			if (!isClickOnTable && !isClickOnModalWindow &&
				e.target.className !== 'column-switcher' &&
				e.target.className !== 'search-btn'
			) {
				self.resetColumnSelection();
			}
		});
	};
	Viewer.prototype.isAnyColumnSelected = function () {
		var i = 0, ln = this.data.columns.length, flag = false;
		for (i, ln; i < ln; i++) {
			if (this.data.columns[i].selectedColumn) {
				flag = true;
				break;
			}
		}
		return flag;
	};
	Viewer.prototype.resetColumnSelection = function () {
		var t, item, isAnyShown = false;
		// don't reset selected column when searchDialog shown
		if(!this.searchDialog.hasClass("closed")) {
			return;
		}
		for (var i = 0; i < this.data.columns.length; i++) {
			item = this.data.columns[i];
			isAnyShown = (item.customIsOldColumnVisible) ? true : isAnyShown;
			if(item.selectedColumn) {
				item.selectedColumn = false;
				t = item.id;
				$('.tbl-fixed-row').find('.' + t).removeClass('colSelected');
				$('.tbl-data').find('.' + t).removeClass('showSelection');
			}
		}
		// change hide/show button status
		isAnyShown ? this.changeBtnStatus(isAnyShown) : this.changeBtnStatus(isAnyShown);
	};
	Viewer.prototype.scrollToFindCell = function (elem) {
		// do not scroll processing if the argument doesn't exist
		if (!elem) { return; }

		var elemCordTop = $(elem).position().top,
			$scrollbarVertical = $(".tbl-data-scroll-vertical > div"),
			gridVieportHeight = $('.tbl-data-wrapper').height(),
			tableHeaderHeight = $('.tbl-fixed-row').height(),
			currentScroll = $scrollbarVertical.scrollTop(),
			value = (currentScroll + elemCordTop) - tableHeaderHeight - gridVieportHeight / 4;

		$scrollbarVertical.animate({scrollTop: value}, '500', 'swing');
	};
	Viewer.prototype.attachKeyboardHoyKeyEvents = function () {
		var self = this;
		// open search pop-up when user prass SHIFT + H
		$(document).on('keydown', function (e) {
			if (e.keyCode === 72 && e.ctrlKey) {
				e.preventDefault();
				$('.search-btn').trigger('click');

				$(this).one('keydown', function (e) {
					if (e.keyCode === 27) {
						self.searchDialog.addClass("closed");
					}
				});
			}
		});
	};
	Viewer.prototype.getPostData = function() {
		var self = this;
		var data = self.data;
		var changeViewerData = {
			categoryRow : data.categoryRow,
			columns : [],
			filename : data.filename,
			rows : []
		};
		var row;
		var fields;

		for (var i=0; i<data.columns.length; i++) {
			changeViewerData.columns.push({
				id : data.columns[i]._id,
				displayName : data.columns[i].displayName
			});
		}

		for (item in data.items) {
			if (data.items.hasOwnProperty(item)) {
				fields = data.items[item];

				row = {
					id : fields.id,
					fields : []
				};
				for (dataField in fields) {
					if (dataField !== 'id') {
						field = {
							columnId : self.getColumnById(dataField)._id,
							newValue : fields[dataField].newValue
						};
						row.fields.push(field);
					}
				}
				changeViewerData.rows.push(row);
			}
		}

		debugger;
		return changeViewerData;
	};
	Viewer.prototype.cellEditorTemplateHTML = '<input type="text" id="cellEditor" value="{val}" onfocus="this.value=this.value;" />';
	Viewer.prototype.columnResizerTemplateHtml = '<a class="column-resizer" href="#" title="Resize column" draggable="false">&nbsp;</a>';
	Viewer.prototype.contextMenuTemplate = '' +
	'<div class="context-menu closed">' +
	'<ul>' +
	'<li class="dsc-order">Sort Descending</li>' +
	'<li class="inc-order">Sort Ascending</li>' +
	'</ul>' +
	'</div>';
	Viewer.prototype.searchAndReplaceDialog = '' +
	'<div id="searchAndReplaceDialog" class="closed">' +
	'<div class="head">' +
	'<span class="title">Find and replace</span>' +
	'<span class="close-lnk">&nbsp;</span>' +
	'</div>' +
	'<div class="body">' +
	'<table>' +
	'<tr>' +
	'<td><label for="findTxt">Find&nbsp;</label></td>' +
	'<td><input type="text" id="findTxt" /></td>' +
	'</tr>' +
	'<tr class="replace-row">' +
	'<td><label for="replaceTxt">Replace with&nbsp;</label></td>' +
	'<td><input type="text" id="replaceTxt" /></td>' +
	'</tr>' +
	'<tr>' +
	'<td><label for="searchAtTxt">Search at&nbsp;</label></td>' +
	'<td><input type="text" id="searchAtTxt" readonly="readonly" value=""/></td>' +
	'</tr>' +
	'</table>' +
	'</div>' +
	'<div class="buttons">' +
	'<input id="findAllBtn" type="button" value="Find all" />' +
	'<input id="replaceAllBtn" type="button" value="Replace all" />' +
	'<input type="button" class="close-btn" value="Done" />' +
	'</div>' +
	'</div>';
	Viewer.prototype.btnHolder = "<div class='btn-holder'><button class=\"column-switcher\">View original</button>" +
	"<button class=\"search-btn\">Find and Replace</button></div>";
	Viewer.prototype.gridTemplateHTML = '' +
	'<table class="grid">' +
	'<tr>' +
	'<td class="column-one">' +
	'<table>' +
	'<tr>' +
	'<th class="corner-top-left" data-column="id">GPID</th>' +
	'</tr>' +
	'<tr>' +
	'<td class="tbl-fixed-column-wrapper">' +
	'<table class="tbl-fixed-column"></table>' +
	'</td>' +
	'</tr>' +
	'<tr>' +
	'<td class="corner-bottom-left">&nbsp;</td>' +
	'</tr>' +
	'</table>' +
	'</td>' +
	'<td class="column-two">' +
	'<table>' +
	'<tr>' +
	'<td class="tbl-fixed-row-wrapper">' +
	'<table class="tbl-fixed-row"></table>' +
	'</td>' +
	'<td class="corner-top-right">&nbsp;</td>' +
	'</tr>' +
	'<tr>' +
	'<td class="tbl-data-wrapper">' +
	'<table class="tbl-data"></table>' +
	'</td>' +
	'<td class="tbl-data-scroll-vertical">' +
	'<div>' +
	'<div></div>' +
	'</div>' +
	'</td>' +
	'</tr>' +
	'<tr>' +
	'<td class="tbl-data-scroll-horizontal">' +
	'<div></div>' +
	'</td>' +
	'<td class="corner-bottom-right">&nbsp;</td>' +
	'</tr>' +
	'</table>' +
	'</td>' +
	'</tr>' +
	'</table>';

	function debounce(func, wait, immediate) {
		var timeout;
		return function () {
			var context = this, args = arguments;
			var later = function () {
				timeout = null;
				if (!immediate) {
					func.apply(context, args);
				}
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) {
				func.apply(context, args);
			}
		};
	}

	return Viewer;
})(window.jQuery);