/**
 * Editor
 *
 * @version 1.0
 */
;(function($, _) {

	var Debug = true;

	var Actions = [],
		CurrentAction = 0;

	var Action = {
		queue: function(name, context, options) {
			Actions[CurrentAction] = [context, options, name];
			CurrentAction++;
			if (Debug) console.log('Acton Queued: ' + Actions[CurrentAction - 1][2]);

			$('.btn[data-action="undo"]').attr('disabled', false);
			return this;
		},
		undo: function() {
			if (CurrentAction - 1 >= 0) {
				if (Debug) console.log('Undo: ' + Actions[CurrentAction - 1][2]);
				Actions[CurrentAction - 1][0].destroy(Actions[CurrentAction - 1][1]);
				CurrentAction -= 1;

				if (CurrentAction == 0) {
					$('.btn[data-action="undo"]').attr('disabled', true);
				} else {
					$('.btn[data-action="redo"]').attr('disabled', false);	
				}
			}
			return this;
		},
		redo: function() {
			if (CurrentAction <= Actions.length) {
				CurrentAction += 1;
				Actions[CurrentAction - 1][0].create(Actions[CurrentAction - 1][1]);
				if (Debug) console.log('Redo: ' + Actions[CurrentAction - 1][2]);
				if (CurrentAction == Actions.length) {
					$('.btn[data-action="redo"]').attr('disabled', true);
				} else {
					$('.btn[data-action="undo"]').attr('disabled', false);
				}
			}
			return this;
		}
	}

	// Editor Instance
	var Editor = function(options) {
		this.options = _.defaults(options, {
			guides: true,
			columns: 2,
			dom: null
		});

		this.$root = $(options.dom);

		this.Layers = [];

		this.CurrentLayer = 0;

		this.Clipboard = null;

		this.Zoom = 1;

		this.init();
	}

	Editor.prototype.init = function() {
		this.$root.addClass('exeditor');

		if (Debug) console.log('Exeditor by Jamoy');

		// setup the toolbar
		this.toolbar();

		if (this.options.guides) {
			var guides = ['guide-top', 'guide-bottom', 'guide-left', 'guide-right', 'guide-middle', 'guide-quarter-left', 'guide-quarter-right'];
			for (var i in guides) {
				$('<div/>').addClass(guides[i] + ' guide').prependTo(this.$root);
			}

			switch (this.options.columns) {
				case 3:
					this.$root.find('.guide-middle').addClass('hidden');
				break;
				case 2:
					this.$root.find('.guide-quarter-left').addClass('hidden');
					this.$root.find('.guide-quarter-right').addClass('hidden');
				break;
			}
		}

		var that = this;
		this.subscribe('mousedown', function(item) {
			that.$root.find('.active').removeClass('active');
			$(item).addClass('active');
		});
	}

	Editor.prototype.toolbar = function() {
		this.$root.before($('<div/>').addClass('extoolbar'));

		var title = $('<div/>').addClass('title').appendTo(this.$root.prev('.extoolbar:eq(0)'));
		$('<input/>').attr('type', 'text').attr('placeholder', 'Untitled Project').appendTo(title);
		var o = $('<button/>').attr('type', 'button').addClass('btn btn-default pull-right').appendTo(title);
		$('<i/>').addClass('fa fa-save').appendTo(o);
		$('<span/>').addClass('caret').appendTo(o);

		var bar = $('<div/>').addClass('btn-toolbar toolbar').appendTo(this.$root.prev('.extoolbar:eq(0)'));

		var toolbar = [
			[
				{
					copy: {
						icon: 'fa-copy',
						disabled: true,
						title: 'Copy (Ctrl + C)'
					},
					cut: {
						icon: 'fa-cut',
						disabled: true,
						title: 'Cut (Ctrl + X)'
					},
					paste: {
						icon: 'fa-paste',
						disabled: true,
						title: 'Paste (Ctrl + V)'
					},
					remove: {
						icon: 'fa-times',
						disabled: true,
						title: 'Remove (Del)'
					}
				}
			],
			[
				{
					undo: {
						icon: 'fa-undo',
						disabled: true,
						title: 'Redo (Ctrl + Z)'
					},
					redo: {
						icon: 'fa-rotate-right',
						disabled: true,
						title: 'Redo (Ctrl + Y)'
					}
				}
			],
			[
				{
					zoomIn: {
						icon: 'fa-search-plus',
						title: 'Zoom In (Ctrl +)'
					},
					zoomOut: {
						icon: 'fa-search-minus',
						disabled: true,
						title: 'Zoom OUt (Ctrl -)'
					}
				}
			],
			[
				{
					option: {
						'class': "pull-right"
					},
					insertImage: {
						icon: 'fa-picture-o',
						title: 'Insert Image'
					},
					insertText: {
						icon: 'fa-font',
						title: 'Insert Text'
					}
				}
			]
		];

		toolbar.forEach(function(tool) {
			tool.forEach(function(i) {
				var b = $('<div/>').addClass('btn-group').appendTo(bar);
				for (var key in i) {
					if (key == 'option') {
						if (i[key].class) {
							b.addClass(i[key].class);
						}
					} else {
						var disabled = i[key].disabled ? true: false;
						var o = $('<button/>').attr('disabled', disabled).attr('title', i[key].title).attr('type', 'button').attr('data-action', key).addClass('btn btn-default').appendTo(b);
						$('<i/>').addClass('fa ' + i[key].icon).appendTo(o);
					}
				}
			});
		});

		var that = this;
		bar.find('.btn').click(function() {
			var action = $(this).data('action');
			if (that[action]) that[action]();
		});

		if (Debug) console.log('Initialized the Toolbar');
	}

	Editor.prototype.copy = function() { }

	Editor.prototype.cut = function() { }

	Editor.prototype.paste = function() { }

	Editor.prototype.remove = function() { }

	Editor.prototype.zoom = function() { }

	Editor.prototype.insert = function() { }

	Editor.prototype.undo = function() {
		Action.undo();
		return this;
	}

	Editor.prototype.redo = function() {
		Action.redo();
		return this;
	}

	/**
	 * Image
	 * attach to layer
	 */
	Editor.prototype.Image = function(options) {
		var options = _.defaults(options, {
			class: '',
			css: {},
			src: '',
			position: [],
			layer: null
		});

		this.create(options);
		Action.queue('Create Image', this, options);
	}

	Editor.prototype.Image.prototype.create = function(options) {
		var layer = options.layer;

		if (layer) {
			options.css.zIndex = parseInt(layer.$root.css('zIndex')) + layer.Items.length;

			this.$root = $('<div/>').addClass('item item-image ' + options.class).css(options.css).prependTo(layer.$root);
			var img = $('<img/>').attr('src', options.src).prependTo(this.$root);
			
			layer.broadcast('newItem', [this]).broadcast('newImage', [this]);
		}
	}

	Editor.prototype.Image.prototype.destroy = function(options) {
		var layer = options.layer;

		if (this.$root) {
			this.$root.remove();			
			layer.broadcast('removeItem', [this]).broadcast('removeImage', [this]);
		}
	}

	/**
	 * Text
	 */
	Editor.prototype.Text = function(options) {
		var options = _.defaults(options, {
			class: '',
			css: {},
			src: '',
			position: [],
			layer: null
		});

		this.create(options);
		Action.queue('Create Text', this, options);
	}

	Editor.prototype.Text.prototype.create = function(options) {
		var layer = options.layer;

		if (layer) {
			options.css.zIndex = parseInt(layer.$root.css('zIndex')) + layer.Items.length;
			this.$root = $('<div/>').html(options.content).attr('contenteditable', true).addClass('item item-text ' + options.class).css(options.css).prependTo(layer.$root);
			layer.broadcast('newItem', [this]).broadcast('newText', [this]);
		}
	}

	Editor.prototype.Text.prototype.destroy = function(options) {
		var layer = options.layer;

		if (this.$root) {
			this.$root.remove();			
			layer.broadcast('removeItem', [this]).broadcast('removeText', [this]);
		}
	}

	/**
	 * Layer
	 */
	Editor.prototype.Layer = function(options) {
		var options = _.defaults(options, {
			class: '',
			css: {},
			editor: null
		});
		var that = this;

		var dragPosition = {};
		var draggableOptions = { 
			containment: "parent", 
			snap: ".guide, .item", 
			snapTolerance: 10,
			start: function(ev, ui) {
				dragPosition = ui.position;
			},
			stop: function(ev, ui) {
				// Create a MOVE event with context $this
				var that = $(this);
				var position = dragPosition;
				Action.queue('Move Item', {
					create: function() {
						that.css(ui.position);
					},
					destroy: function() {
						that.css(position);
					}
				}, ui);
				dragPosition = {};
			}
		}

		var resizableOptions = {
			containment: "parent", 
			handles: "all",
			autoHide: true
		}

		this.create(options);
		Action.queue('Create Layer', this, options);

		// events
		this.subscribe('newItem', function(item) {
			that.Items.push(item);
		 	that.$root.find(".item")
			 	.draggable(draggableOptions)
			 	.resizable(resizableOptions);
			 	// Support Rotate
		});

		this.subscribe('removeItem', function(item) {
			that.Items.pop();
		});
	}

	Editor.prototype.Layer.prototype.create = function(options) {
		var editor = options.editor;

		if (!editor.options.snap) {
 			draggableOptions.snap = false;
		}

		this.Items = [];

		options.css.zIndex = 10000 * editor.Layers.length + 1;

		this.$root = $('<div/>').addClass('layer ' + options.class).css(options.css).prependTo(editor.$root);
		editor.Layers.push(this.$root);

		// clicky clicky
		editor.$root
		.on('click', '.item', function(e) {
			editor.broadcast('click', [this, e]);
		})
		.on('mousedown', '.item', function(e) {
			editor.broadcast('mousedown', [this, e]);
		})
		.on('dblclick', '.item', function(e) {
			editor.broadcast('doubleclick', [this, e]);
		})
		.on('keypress', '.item', function(e) {
			editor.broadcast('keypress', [this, e]);
		});
	}

	Editor.prototype.Layer.prototype.destroy = function(options) {
		this.$root.remove();
		options.editor.Layers.pop();
	}

	Editor.prototype.Layer.prototype.remove = function(index) {
		if (index != null) {
			if (this.Items[index]) {
				this.Items[index].$root.remove();
			}
		} else {
			this.$root.remove();
		}
	}

	Editor.prototype.Layer.prototype.clear = function() {
		this.Items = [];
		this.$root.html('');
	}

	// Support Events
	var PubSub = {
		events: {},
		subscribe: function(event, cb) {
			if (!this.events[event]) this.events[event] = [];
			this.events[event].push(cb);
			return this;
		},
		broadcast: function(event, params) {
			if (this.events[event]) {
				this.events[event].forEach(function(cb) {
					cb.apply(this, params);
				});
			}
			return this;
		}
	}

	_.extend(Editor.prototype, PubSub);
	_.extend(Editor.prototype.Layer.prototype, PubSub);
	_.extend(Editor.prototype.Image.prototype, PubSub);

	// Items
	var Item = {
		moveUp: function() {
			var that = this;
			var action = {
				create: function() {
					var zIndex = that.$root.css('zIndex');
					that.$root.css('zIndex', parseInt(zIndex) + 1);
				},
				destroy: function() {},
			}

			action.create();
			Action.queue('Item Move Up Z-Index', action);
			return this;
		},
		moveDown: function() {
			var that = this;
			var action = {
				create: function() {
					var zIndex = that.$root.css('zIndex');
					that.$root.css('zIndex', parseInt(zIndex) - 1);
				},
				destroy: function() {},
			}

			action.create();
			Action.queue('Item Move Down Z-Index', action);
			return this;
		},
		move: function(x, y, z) {
			return this;
		}
	}

	_.extend(Editor.prototype.Layer.prototype, Item);
	_.extend(Editor.prototype.Image.prototype, Item);

	// Expose
	window.Editor = Editor;
	window.Editor.Layer = Editor.prototype.Layer;
	window.Editor.Image = Editor.prototype.Image;
	window.Editor.Text = Editor.prototype.Text;
})(jQuery, _);