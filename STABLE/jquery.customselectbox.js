/*
    Copyright 2016 Jaycliff Arcilla of Eversun Software Philippines Corporation (Davao Branch)

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
/*jslint browser: true, devel: true */
/*global jQuery, module*/
(function (window, $) {
    "use strict";
    // $.fn === $.prototype
    var $document = $(document),
        $window = $(window),
		$html,
        $body,
        has_class_list = !!document.documentElement.classList,
		trigger_param_list = [],
        list_of_csb = [],
        list_pool,
		index = 0,
        extend_options,
        eacher_default_options = { 'min-width': '50px' },
        placeholder_text = '',
        default_placeholder_text = 'Select an item';
	if (typeof Object.freeze !== "function") {
		Object.freeze = function freeze(obj) {
			console.log('NOTE: This host does not have this feature [Object.freeze]');
			return obj;
		};
	}
    $document.ready(function () {
        var csb_drop_container;
		$html = $('html');
        $body = $('body');
    });
    window.$body = $body; // Debug
    window.list_of_csb = list_of_csb; // Debug
    // this is where the list elements get created/recycled
    list_pool = (function listPoolSetup() {
        var pool = [], decoy = document.createElement('br');
        return {
            'summon': function summon() {
                var list;
                if (pool.length > 0) {
                    list = pool.pop();
                } else {
                    list = document.createElement('li');
                    if (!has_class_list) {
                        $.data(list, '$this', $(list));
                    }
                }
                return list;
            },
            'shave': function shave(parent) {
                var offspring, item, gramps = parent.parentElement;
                if (parent.children.length > 0) {
                    gramps.replaceChild(decoy, parent);
                    offspring = parent.children;
                    while (offspring.length) {
                        item = parent.removeChild(offspring[0]);
                        item.textContent = '';
                        item.removeAttribute('class');
                        //item.removeAttribute('data-csb-option-index');
                        pool.push(item);
                    }
                    gramps.replaceChild(parent, decoy);
                }
            }
        };
    }());
    function updateChildrenList(parent, list_of_children) {
        var i, a, len1 = parent.children.length, len2, og;
        list_of_children.length = 0;
        for (i = 0; i < len1; i += 1) {
            switch (parent.children[i].tagName.toLowerCase()) {
            case 'optgroup':
                og = parent.children[i];
                list_of_children.push(og);
                for (a = 0, len2 = og.children.length; a < len2; a += 1) {
                    if (og.children[a].tagName.toLowerCase() === 'option') {
                        list_of_children.push(og.children[a]);
                    }
                }
                break;
            case 'option':
                list_of_children.push(parent.children[i]);
                break;
            }
        }
    }
    function createSelectBoxStructure($this) {
        var wrap = document.createElement('span'),
            csb_single = document.createElement('span'),
            csb_label = document.createElement('span'),
            csb_drop = document.createElement('span'),
            csb_arrow = document.createElement('span'),
            csb_ol_wrap = document.createElement('span'),
            csb_option_list = document.createElement('ul'),
			parts,
            $wrap,
            $csb_single,
            $csb_label,
            $csb_drop,
			$csb_ol_wrap,
            current_index = $this.prop('selectedIndex'),
            is_open = false,
            // list_of_children contains all options and optgroups of a given select element. used in generating the list items of the proxy
            list_of_children = [],
            selected_item = null,
            closeCSB,
            openCSB;
        $this.data('csb:open', false).attr('data-csb', 'true').addClass('csb-enabled').attr('data-csb-id', index);
		index += 1;
        $this.on('change', function (event) {
            current_index = this.selectedIndex;
            // If event is manually-triggered...
            if (!event.originalEvent) {
                $this.trigger('csb:update-proxy');
            }
        });
        wrap.className = 'csb-container csb-container-single csb-mc';
        if ($this.prop('disabled')) {
            if (has_class_list) {
                wrap.classList.add('csb-disabled');
            } else {
                wrap.className += ' csb-disabled';
            }
        }
        csb_single.className = 'csb-single';
        csb_label.className = 'csb-label';
        csb_single.appendChild(csb_label);
        csb_arrow.className = 'csb-arrow';
        csb_single.appendChild(csb_arrow);
        wrap.appendChild(csb_single);
        // bottom
        csb_drop.className = 'csb-drop csb-mc regular';
        csb_ol_wrap.className = 'csb-ol-wrap';
        csb_option_list.className = 'csb-option-list';
        placeholder_text = $this[0].getAttribute('data-placeholder');
        if ($this[0].selectedIndex === -1) {
            if (placeholder_text) {
                csb_label.textContent = placeholder_text;
            } else {
                csb_label.textContent = default_placeholder_text;
            }
            if (has_class_list) {
                csb_single.classList.add('csb-empty');
            } else {
                csb_single.className += ' csb-empty';
            }
        }
        // update the list of option and optgroups (list_of_children)
        updateChildrenList($this[0], list_of_children);
        (function openCloseSetup() {
            var event = $.Event('csb:close-proxy'),
                initial_dropdown_height,
                reverse_drop = false,
				is_hidden = false,
                reset_top = false, // Helps avoid overflow problems when resetting the top value
                raf_id;
            event.which = 1;
            function rafCallback() {
				var wrap_y = $wrap.getY();
                $csb_drop
                    .css('width', $wrap.outerWidth())
                    .css('left', $wrap.getX());
				if (reverse_drop) {
                    if (reset_top) {
						csb_drop.style.top = '';
                        reset_top = false;
                    }
					$csb_drop.css('bottom', $window.height() - wrap_y);
					if (wrap_y - parseInt($csb_drop.css('margin-bottom'), 10) < $csb_drop.outerHeight()) {
						setTimeout(resizeHandler, 0);
					}
				} else {
					$csb_drop.css('top', wrap_y + $wrap.outerHeight());
					if ($window.height() < $csb_drop.outerHeight() + ($wrap.outerHeight() + wrap_y) + parseInt($csb_drop.css('margin-top'), 10)) {
						setTimeout(resizeHandler, 0);
					}
				}
				if (is_hidden) {
					$csb_drop[0].style.visibility = '';
					is_hidden = false;
				}
				trigger_param_list.push(parts);
				$this.trigger('csb:dropdownrefresh', trigger_param_list);
				trigger_param_list.length = 0;
                raf_id = requestAnimationFrame(rafCallback);
            }
            function resizeHandler() {
				var window_height = $window.height(),
					wrap_y = $wrap.getY(),
					normal_dropdown_target_y = ($wrap.outerHeight() + wrap_y) + parseInt($csb_drop.css('margin-top'), 10),
					initial_normal_total_height = initial_dropdown_height + normal_dropdown_target_y,
					top_height;
				if (reverse_drop) {
					$csb_drop.css('visibility', 'hidden');
					is_hidden = true;
				}
				// Set the dropdown to upper left to avoid overflow scrollbars on body
				$csb_drop.css('visibility', 'hidden').css('width', $wrap.outerWidth()).css('left', -$csb_drop.outerWidth()).css('top', -$csb_drop.outerHeight());
				is_hidden = true;
                if (window_height < initial_normal_total_height) {
					//console.log('WINDOW HEIGHT: ' + window_height + ', INITIAL DROPDOWN HEIGHT: ' + initial_dropdown_height + ', INITIAL TOTAL HEIGHT: ' + initial_normal_total_height);
					//console.log('TOP: ' + $csb_drop.css('top') + ', LEFT: ' + $csb_drop.css('left'));
                    top_height = wrap_y - ((reverse_drop) ? parseInt($csb_drop.css('margin-bottom'), 10) : parseInt($csb_drop.css('margin-top'), 10));
					if (top_height >= initial_dropdown_height) {
                        //csb_drop.style.top = '';
                        reset_top = true;
                        csb_ol_wrap.style.maxHeight = '';
						if (!reverse_drop) {
							$csb_drop.removeClass('regular');
							$wrap.addClass('csb-reverse');
							reverse_drop = true;
						}
						console.log('drop above');
					} else {
						if (top_height > window_height - normal_dropdown_target_y) {
							if (!reverse_drop) {
								$csb_drop.removeClass('regular');
								$wrap.addClass('csb-reverse');
								reverse_drop = true;
							}
							$csb_drop.css('top', 0);
							csb_ol_wrap.style.maxHeight = '100%';
							console.log('top sticky');
						} else {
							if (reverse_drop) {
								$csb_drop.addClass('regular');
								$wrap.removeClass('csb-reverse');
								reverse_drop = false;
							}
							$csb_drop.css('bottom', 0);
							csb_ol_wrap.style.maxHeight = '100%';
							console.log('bottom sticky');
						}
					}
                    //console.log('BOOM');
                } else {
                    csb_drop.style.bottom = '';
                    csb_ol_wrap.style.maxHeight = '';
					if (reverse_drop) {
						$csb_drop.addClass('regular');
						$wrap.removeClass('csb-reverse');
						reverse_drop = false;
					}
					console.log('normal');
                }
                console.log($csb_drop.css('top'));
            }
            function bodyHandler(event) {
                // csb_single is included here since we're triggering closeCSB on its event handler
                if (!csb_drop.contains(event.target) && !csb_single.contains(event.target)) {
                    closeCSB(event);
                }
            }
            openCSB = function openCSB() {
                var i, length, $item;
                if (!is_open) {
                    console.log('openCSB');
                    is_open = true;
                    $this.data('csb:open', true);
                    for (i = 0, length = list_of_csb.length; i < length; i += 1) {
                        $item = list_of_csb[i];
                        if ($item !== $this && $item.data('csb:open')) {
                            $item.trigger(event); // Close any open dropdown
                        }
                    }
                    if (has_class_list) {
                        csb_single.parentNode.classList.add('csb-with-drop');
                        csb_single.parentNode.classList.add('csb-container-active');
                    } else {
                        $.data(csb_single.parentNode, '$this').addClass('csb-with-drop');
                        $.data(csb_single.parentNode, '$this').addClass('csb-container-active');
                    }
                    if (reverse_drop) {
                        $csb_drop.addClass('regular');
                        $wrap.removeClass('csb-reverse');
                        reverse_drop = false;
                    }
                    //$csb_drop.css('opacity', 0).show().css('top', -$csb_drop.outerHeight()).css('left', -$csb_drop.outerWidth());
                    $csb_drop.show();
                    initial_dropdown_height = $csb_drop.outerHeight();
                    $window.on('resize', resizeHandler);
                    resizeHandler();
                    raf_id = requestAnimationFrame(rafCallback);
                    //wrap.scrollIntoView();
                    if (typeof wrap.scrollIntoViewIfNeeded === "function") {
                        wrap.scrollIntoViewIfNeeded();
                    }
                    setTimeout(function () {
                        $document.on('mousedown touchstart', closeCSB);
                    }, 0);
                    document.body.addEventListener('mousedown', bodyHandler, true);
                    document.body.addEventListener('touchstart', bodyHandler, true);
                    trigger_param_list.push(parts);
                    $this.trigger('csb:open', trigger_param_list);
                    trigger_param_list.length = 0;
                }
            };
            closeCSB = function closeCSB(event) {
                if (is_open) {
                    //console.log(event);
                    console.log('closeCSB');
                    //console.log(event);
                    is_open = false;
                    $this.data('csb:open', false);
                    if (has_class_list) {
                        csb_single.parentNode.classList.remove('csb-with-drop');
                        csb_single.parentNode.classList.remove('csb-container-active');
                    } else {
                        $csb_single.removeClass('csb-with-drop');
                        $csb_single.removeClass('csb-container-active');
                    }
                    cancelAnimationFrame(raf_id);
                    $csb_drop.hide();
                    //console.log('closed');
                    $document.off('mousedown touchstart', closeCSB);
                    csb_drop.style.bottom = '';
                    csb_ol_wrap.style.maxHeight = '';
                    $window.off('resize', resizeHandler);
                    document.body.removeEventListener('mousedown', bodyHandler, true);
                    document.body.removeEventListener('touchstart', bodyHandler, true);
                    trigger_param_list.push(parts);
                    $this.trigger('csb:close', trigger_param_list);
                    trigger_param_list.length = 0;
                }
            };
        }());
        $this.on('csb:close-proxy', closeCSB);
        $this.on('csb:open-proxy', openCSB);
        function createDropdownStructure() {
            var i,
                optgroup,
                length,
                index = 0,
                li;
            for (i = 0, length = list_of_children.length; i < length; i += 1) {
                li = list_pool.summon();
                switch (list_of_children[i].tagName.toLowerCase()) {
                case 'optgroup':
                    optgroup = list_of_children[i];
                    if (has_class_list) {
                        li.classList.add('group-result');
                    } else {
                        li.className = 'group-result';
                    }
                    li.textContent = list_of_children[i].label;
                    break;
                case 'option':
                    if (!list_of_children[i].disabled) {
                        if (has_class_list) {
                            li.classList.add('active-result');
                        } else {
                            li.className = 'active-result';
                        }
                    } else {
                        if (has_class_list) {
                            li.classList.add('disabled-result');
                        } else {
                            li.className = 'disabled-result';
                        }
                    }
                    $.data(li, 'csb-option-index', index);
                    if (optgroup && list_of_children[i].parentNode === optgroup) {
                        if (has_class_list) {
                            li.classList.add('group-option');
                        } else {
                            li.className += ' group-option';
                        }
                    }
                    li.textContent = list_of_children[i].textContent;
                    //console.log($this[0].name);
                    if (list_of_children[i].value === $this[0].value && index === $this[0].selectedIndex) {
                        if ($this[0].selectedIndex === 0) {
                            if (has_class_list) {
                                csb_single.classList.add('csb-default');
                            } else {
                                csb_single.className += ' csb-default';
                            }
                        }
                        csb_label.textContent = li.textContent;
                        if (has_class_list) {
                            li.classList.add('csb-selected');
                        } else {
                            li.className += ' csb-selected';
                        }
                        selected_item = li;
                        if (list_of_children[i].disabled) {
                            if (has_class_list) {
                                //csb_single.classList.add('csb-default');
                                li.classList.add('disabled-result');
                            } else {
                                //csb_single.className += ' csb-default';
                                li.className += ' disabled-result';
                            }
                        }
                    }
                    index += 1;
                    break;
                }
                csb_option_list.appendChild(li);
            }
        }
        createDropdownStructure();
        csb_drop.appendChild(csb_ol_wrap);
        csb_ol_wrap.appendChild(csb_option_list);
        $this.data('csb::csb_option_list', csb_option_list);
        //wrap.appendChild(csb_drop);
        $body.append(csb_drop);
        $this.data('csb:refresh-proxy-structure', function () {
            $this.trigger('csb:beforelistupdate');
            list_pool.shave(csb_option_list);
            updateChildrenList($this[0], list_of_children);
            if (has_class_list) {
                csb_single.classList.remove('csb-default');
            } else {
                $csb_single.removeClass('csb-default');
            }
            current_index = $this[0].selectedIndex;
            createDropdownStructure();
            $this.trigger('csb:listupdate');
        });
        $this.after(wrap);
        $wrap = $(wrap);
        $this.data('csb::$wrap', $wrap);
        $csb_single = $(csb_single);
        $this.data('csb::$csb_single', $csb_single);
        $csb_single.on('mousedown touchstart', function (event) {
            if ($this[0].disabled) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            //console.log('CSB SINGLE: ' + event.type);
            if (event.type === 'mousedown' && event.which === 3) {
                return;
            }
            event.stopPropagation();
            if (is_open) {
                closeCSB();
            } else {
                openCSB();
            }
        });
        $csb_label = $(csb_label);
        $this.data('csb::$csb_label', $csb_label);
        $csb_drop = $(csb_drop).hide();
		$csb_ol_wrap = $(csb_ol_wrap);
        $this.data('csb::$csb_drop', $csb_drop);
        $csb_drop.on('mousedown touchstart', function (event) {
            event.preventDefault();
            event.stopPropagation();
        });
        // Start $this-a-thon
        $.data(wrap, '$this', $wrap);
        $.data(csb_single, '$this', $csb_single);
        $.data(csb_label, '$this', $csb_label);
        $.data(csb_drop, '$this', $csb_drop);
        // End $this-a-thon
        $csb_drop.on('touchstart', 'li.group-result, li.disabled-result', function (event) {
            event.stopPropagation();
            //console.log(event.originalEvent);
        });
        (function () {
            var $csb_option_list = $(csb_option_list), touch_id = 0, prevX = 0, prevY = 0, tm_attached = false;
            function touchmove(event) {
                var originalEvent = event.originalEvent, changedTouches, touch_object;
                changedTouches = originalEvent.changedTouches;
                touch_object = changedTouches[changedTouches.length - 1];
                console.log(touch_id, prevX, prevY, touch_object.identifier, touch_object.pageX, touch_object.pageY);
                if (touch_object.identifier !== touch_id || (touch_object.pageX === prevX && touch_object.pageY === prevY)) {
                    console.log('cancel touchmove');
                    event.stopPropagation();
                    return;
                }
                console.log((touch_object.pageY - prevY));
                if (Math.abs(touch_object.pageY - prevY) <= 10) {
                    event.stopPropagation();
                } else {
                    if (tm_attached) {
                        tm_attached = false;
                        $csb_option_list.off('touchmove', touchmove);
                    }
                }
            }
            $csb_drop.on('mousedown touchstart touchmove touchend touchcancel', 'li.active-result', function (event) {
                var option_index, originalEvent = event.originalEvent, changedTouches, touch_object;
                // console.log(event);
                // Calling event.preventDefault() somehow stops touchmove from triggering right after touchstart
                if (!originalEvent) {
                    return;
                }
                event.preventDefault();
                console.log(event.type);
                switch (event.type) {
                case 'mousedown':
                    if (event.which === 3) {
                        return;
                    }
                    $.data(this, 'selected', false);
                    break;
                // The touch events here simulate a mouse click
                case 'touchstart':
                    $.data(this, 'selected', true);
                    event.stopPropagation();
                    changedTouches = originalEvent.changedTouches;
                    touch_object = changedTouches[changedTouches.length - 1];
                    touch_id = touch_object.identifier;
                    prevX =  touch_object.pageX;
                    prevY =  touch_object.pageY;
                    if (!tm_attached) {
                        tm_attached = true;
                        $csb_option_list.on('touchmove', touchmove);
                    }
                    //console.log('list item activated');
                    return;
                case 'touchmove':
                    console.log('can touchmove now');
                    /* falls through */
                case 'touchcancel':
                    if ($.data(this, 'selected')) {
                        $.data(this, 'selected', false);
                        //console.log('list item cancelled');
                    }
                    //event.stopPropagation();
                    return;
                case 'touchend':
                    if (tm_attached) {
                        tm_attached = false;
                        $csb_option_list.off('touchmove', touchmove);
                    }
                    if ($.data(this, 'selected')) {
                        $.data(this, 'selected', false);
                        break;
                    } else {
                        return;
                    }
                }
                event.stopPropagation();
                option_index = $.data(this, 'csb-option-index');
                if (current_index !== option_index) {
                    if (has_class_list) {
                        csb_single.classList.remove('csb-empty');
                    } else {
                        $csb_single.removeClass('csb-empty');
                    }
                    if (option_index > 0) {
                        if (has_class_list) {
                            csb_single.classList.remove('csb-default');
                        } else {
                            $csb_single.removeClass('csb-default');
                        }
                    } else {
                        if (has_class_list) {
                            csb_single.classList.add('csb-default');
                        } else {
                            $csb_single.addClass('csb-default');
                        }
                    }
                    if (selected_item) {
                        if (has_class_list) {
                            selected_item.classList.remove('csb-selected');
                        } else {
                            $.data(selected_item, '$this').removeClass('csb-selected');
                        }
                    }
                    selected_item = this;
                    if (has_class_list) {
                        this.classList.add('csb-selected');
                    } else {
                        this.className += ' csb-selected';
                    }
                    csb_label.textContent = this.textContent;
                    $this.prop('selectedIndex', option_index).trigger('change');
                }
                //console.log(option_index);
                closeCSB(event);
            });
        }());
		parts = Object.freeze({
			'select': $this,
			'wrap': $wrap,
			'single': $csb_single,
			'label': $csb_label,
			'arrow': $(csb_arrow),
			'drop': $csb_drop,
			'ol-wrap': $csb_ol_wrap,
			'option-list': $(csb_option_list)
		});
        // return the newly created elements
        return wrap;
    }
    function eacher() {
        var $this, options, key;
        /*jshint validthis: true */
        if (this.tagName.toLowerCase() === 'select') {
            if (eacher.hasOwnProperty('options') && typeof eacher.options === "object") {
                options = eacher.options;
                delete eacher.options;
            } else {
                options = eacher_default_options;
            }
            //options = (eacher.hasOwnProperty('options') && typeof eacher.options === "object") ? eacher.options : eacher_default_options;
            if (!$.data(this, 'csb-$this')) {
                $this = $(this);
                list_of_csb.push($this);
                $.data(this, 'csb-$this', $this);
                $.data(this, 'csb-proxy', createSelectBoxStructure($this));
                for (key in options) {
                    if (Object.prototype.hasOwnProperty.call(options, key)) {
                        $this.data('csb::$wrap').css(key, options[key]);
                    }
                }
                $this.on('csb:update-proxy', function () {
                    //console.log('This is where we update the proxy');
                    //console.log(placeholder_text);
                    if (this.selectedIndex === -1) {
                        placeholder_text = this.getAttribute('data-placeholder');
                        if (placeholder_text) {
                            $this.data('csb::$csb_label').text(placeholder_text);
                        } else {
                            $this.data('csb::$csb_label').text(default_placeholder_text);
                        }
                        if (has_class_list) {
                            $this.data('csb::$csb_single')[0].classList.add('csb-empty');
                        } else {
                            $this.data('csb::$csb_single').addClass('csb-empty');
                        }
                    } else {
                        $this.data('csb::$csb_label').text($this[0].value);
                        if (has_class_list) {
                            $this.data('csb::$csb_single')[0].classList.remove('csb-empty');
                        } else {
                            $this.data('csb::$csb_single').removeClass('csb-empty');
                        }
                    }
                    if ($this.prop('disabled')) {
                        if (has_class_list) {
                            $this.data('csb::$wrap')[0].classList.add('csb-disabled');
                        } else {
                            $this.data('csb::$wrap').addClass('csb-disabled');
                        }
                    } else {
                        if (has_class_list) {
                            $this.data('csb::$wrap')[0].classList.remove('csb-disabled');
                        } else {
                            $this.data('csb::$wrap').removeClass('csb-disabled');
                        }
                    }
                    $this.data('csb:refresh-proxy-structure')();
                });
                // Start experiment
                Object.defineProperty($this.get(0), 'csbSelectedIndex', {
                    get: function getter() {
                        return this.selectedIndex;
                    },
                    set: function setter(value) {
                        this.selectedIndex = value;
                        $this.trigger('csb:update-proxy');
                    }
                });
                // End experiment
                $this.hide();
            } else {
                $this = $.data(this, 'csb-$this');
                console.log('This select box already has an existing customSelectBox instance');
            }
            //console.log('Plugin is not ready');
        }
    }
    extend_options = {
        customSelectBox: function (options) {
            if (typeof options === "object") {
                eacher.options = options;
            }
            this.each(eacher);
            return this;
        }
    };
    extend_options.customSelectBox.closeAll = function closeAll() {
        var k, len;
        for (k = 0, len = list_of_csb.length; k < len; k += 1) {
            list_of_csb[k].trigger('csb:close-proxy');
        }
    };
    $.fn.extend(extend_options);
}(window, (typeof jQuery === "function" && jQuery) || (typeof module === "object" && typeof module.exports === "function" && module.exports)));