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
        $body,
        has_class_list = !!document.documentElement.classList,
        list_of_csb = [],
        list_pool,
        extend_options,
        eacher_default_options = { 'min-width': '50px' },
        placeholder_text = '',
        default_placeholder_text = 'Select an item';
    $document.ready(function () {
        $body = $('body');
    });
    window.$body = $body; // Debug
    window.list_of_csb = list_of_csb;
    // this is where the list elements get created/recycled
    list_pool = (function listPoolSetup() {
        var pool = [];
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
                var offspring, item;
                if (parent.children.length > 0) {
                    offspring = parent.children;
                    while (offspring.length) {
                        item = parent.removeChild(offspring[0]);
                        item.textContent = '';
                        item.removeAttribute('class');
                        //item.removeAttribute('data-csb-option-index');
                        pool.push(item);
                    }
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
            raf_id,
            $wrap,
            $csb_single,
            $csb_label,
            $csb_drop,
            current_index = $this.prop('selectedIndex'),
            // list_of_children contains all options and optgroups of a given select element. used in generating the list items of the proxy
            list_of_children = [],
            selected_item = null,
            closeCSB,
            openCSB;
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
        csb_drop.className = 'csb-drop csb-mc';
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
        (function () {
            var event = $.Event('csb:close-proxy');
            event.which = 1;
            function rafCallback() {
                $csb_drop
                    .css('width', $wrap.outerWidth())
                    .css('top', $wrap.getY() + $wrap.outerHeight())
                    .css('left', $wrap.getX());
                raf_id = requestAnimationFrame(rafCallback);
            }
            openCSB = function () {
                var i, length = list_of_csb.length;
                for (i = 0; i < length; i += 1) {
                    list_of_csb[i].trigger(event);
                }
                if (has_class_list) {
                    csb_single.parentNode.classList.add('csb-with-drop');
                    csb_single.parentNode.classList.add('csb-container-active');
                } else {
                    $.data(csb_single.parentNode, '$this').addClass('csb-with-drop');
                    $.data(csb_single.parentNode, '$this').addClass('csb-container-active');
                }
                $csb_drop.show();
                wrap.scrollIntoView();
                raf_id = requestAnimationFrame(rafCallback);
                $document.on('mousedown custom:touchdown', closeCSB);
            };
        }());
        closeCSB = function (event) {
            if (event.which === 1 || event.type === 'custom:touchdown') {
                if (has_class_list) {
                    csb_single.parentNode.classList.remove('csb-with-drop');
                    csb_single.parentNode.classList.remove('csb-container-active');
                } else {
                    $csb_single.removeClass('csb-with-drop');
                    $csb_single.removeClass('csb-container-active');
                }
                cancelAnimationFrame(raf_id);
                $csb_drop.hide();
                $document.off('mousedown custom:touchdown', closeCSB);
            }
        };
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
        //wrap.appendChild(csb_drop);
        $body.append(csb_drop);
        $this.data('csb:refresh-proxy-structure', function () {
            list_pool.shave(csb_option_list);
            updateChildrenList($this[0], list_of_children);
            if (has_class_list) {
                csb_single.classList.remove('csb-default');
            } else {
                $csb_single.removeClass('csb-default');
            }
            current_index = $this[0].selectedIndex;
            createDropdownStructure();
        });
        $this.after(wrap);
        $wrap = $(wrap);
        $this.data('csb-$wrap', $wrap);
        $csb_single = $(csb_single);
        $this.data('csb-$csb_single', $csb_single);
        $csb_single.on('mousedown custom:touchdown', function (event) {
            if (event.which === 1 || event.type === 'custom:touchdown') {
                event.stopPropagation();
                if ($this[0].disabled) {
                    return;
                }
                if (has_class_list) {
                    if (!csb_single.parentNode.classList.contains('csb-with-drop')) {
                        openCSB();
                    } else {
                        closeCSB(event);
                    }
                } else {
                    if (!$.data(csb_single.parentNode, '$this').hasClass('csb-with-drop')) {
                        openCSB();
                    } else {
                        closeCSB(event);
                    }
                }
            }
        });
        $csb_label = $(csb_label);
        $this.data('csb-$csb_label', $csb_label);
        $csb_drop = $(csb_drop).hide();
        $csb_drop.on('mousedown custom:touchdown', function (event) {
            event.stopPropagation();
        });
        // Start $this-a-thon
        $.data(wrap, '$this', $wrap);
        $.data(csb_single, '$this', $csb_single);
        $.data(csb_label, '$this', $csb_label);
        $.data(csb_drop, '$this', $csb_drop);
        // End $this-a-thon
        $csb_drop.on('mousedown custom:touchdown touchstart', 'li.active-result', function (event) {
            var option_index;
            event.preventDefault();
            if (event.which === 1 || event.type === 'custom:touchdown' || event.type === 'touchstart') {
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
            }
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
                        switch (key) {
                        case 'width':
                            $this.data('csb-$wrap').css('width', options[key]);
                            break;
                        case 'min-width':
                            $this.data('csb-$wrap').css('min-width', options[key]);
                            break;
                        }
                    }
                }
                $this.on('csb:update-proxy', function () {
                    //console.log('This is where we update the proxy');
                    //console.log(placeholder_text);
                    if (this.selectedIndex === -1) {
                        placeholder_text = this.getAttribute('data-placeholder');
                        if (placeholder_text) {
                            $this.data('csb-$csb_label').text(placeholder_text);
                        } else {
                            $this.data('csb-$csb_label').text(default_placeholder_text);
                        }
                        if (has_class_list) {
                            $this.data('csb-$csb_single')[0].classList.add('csb-empty');
                        } else {
                            $this.data('csb-$csb_single').addClass('csb-empty');
                        }
                    } else {
                        $this.data('csb-$csb_label').text($this[0].value);
                        if (has_class_list) {
                            $this.data('csb-$csb_single')[0].classList.remove('csb-empty');
                        } else {
                            $this.data('csb-$csb_single').removeClass('csb-empty');
                        }
                    }
                    if ($this.prop('disabled')) {
                        if (has_class_list) {
                            $this.data('csb-$wrap')[0].classList.add('csb-disabled');
                        } else {
                            $this.data('csb-$wrap').addClass('csb-disabled');
                        }
                    } else {
                        if (has_class_list) {
                            $this.data('csb-$wrap')[0].classList.remove('csb-disabled');
                        } else {
                            $this.data('csb-$wrap').removeClass('csb-disabled');
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
    $.fn.extend(extend_options);
}(window, (typeof jQuery === "function" && jQuery) || (typeof module === "object" && typeof module.exports === "function" && module.exports)));
