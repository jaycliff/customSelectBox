/*
    Copyright 2014 Jaycliff Arcilla of Eversun Software Philippines Corporation (Davao Branch)
    
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
/*global jQuery*/
(function ($) {
    "use strict";
    // $.fn === $.prototype
    var $document = $(document),
        has_class_list = !!document.documentElement.classList,
        list_of_csb = [],
        extend_options,
        placeholder_text = '',
        default_placeholder_text = 'Select an item';
    window.list_of_csb = list_of_csb;
    function createSelectBoxStructure($this) {
        var wrap = document.createElement('div'),
            csb_single = document.createElement('div'),
            csb_label = document.createElement('span'),
            csb_drop = document.createElement('div'),
            csb_arrow = document.createElement('span'),
            csb_option_list = document.createElement('ul'),
            $wrap,
            $csb_single,
            $csb_label,
            $csb_drop,
            // children contains all options and optgroups of a given select element. used in generating the list items of the proxy
            children = [],
            list_pool,
            selected_item = null,
            closeCSB,
            openCSB,
            index = 0;
        wrap.className = 'csb-container csb-container-single';
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
        csb_drop.className = 'csb-drop';
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
        // update the list of option and optgroups (children)
        function updateChildren() {
            var parent = $this[0], i, a, len1 = parent.children.length, len2, og;
            children.length = 0;
            for (i = 0; i < len1; i += 1) {
                switch (parent.children[i].tagName.toLowerCase()) {
                case 'optgroup':
                    og = parent.children[i];
                    children.push(og);
                    for (a = 0, len2 = og.children.length; a < len2; a += 1) {
                        if (og.children[a].tagName.toLowerCase() === 'option') {
                            children.push(og.children[a]);
                        }
                    }
                    break;
                case 'option':
                    children.push(parent.children[i]);
                    break;
                }
            }
        }
        updateChildren();
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
        (function () {
            var event = $.Event('csb:close-proxy');
            event.which = 1;
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
                $document.on('mousedown', closeCSB);
            };
        }());
        closeCSB = function (event) {
            if (event.which === 1) {
                if (has_class_list) {
                    csb_single.parentNode.classList.remove('csb-with-drop');
                    csb_single.parentNode.classList.remove('csb-container-active');
                } else {
                    $csb_single.removeClass('csb-with-drop');
                    $csb_single.removeClass('csb-container-active');
                }
                $document.off('mousedown', closeCSB);
            }
        };
        $this.on('csb:close-proxy', closeCSB);
        $this.on('csb:open-proxy', openCSB);
        function createDropdownStructure() {
            var i,
                optgroup,
                length,
                li;
            for (i = 0, length = children.length; i < length; i += 1) {
                li = list_pool.summon();
                switch (children[i].tagName.toLowerCase()) {
                case 'optgroup':
                    optgroup = children[i];
                    if (has_class_list) {
                        li.classList.add('group-result');
                    } else {
                        li.className = 'group-result';
                    }
                    li.textContent = children[i].label;
                    break;
                case 'option':
                    if (!children[i].disabled) {
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
                    if (optgroup && children[i].parentNode === optgroup) {
                        if (has_class_list) {
                            li.classList.add('group-option');
                        } else {
                            li.className += ' group-option';
                        }
                    }
                    li.textContent = children[i].textContent;
                    //console.log($this[0].name);
                    if (children[i].value === $this[0].value && index === $this[0].selectedIndex) {
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
                        if (children[i].disabled) {
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
        csb_drop.appendChild(csb_option_list);
        wrap.appendChild(csb_drop);
        $this.data('csb:refresh-proxy-structure', function () {
            list_pool.shave(csb_option_list);
            updateChildren();
            if (has_class_list) {
                csb_single.classList.remove('csb-default');
            } else {
                $csb_single.removeClass('csb-default');
            }
            index = 0;
            createDropdownStructure();
        });
        $this.data('list-pool', list_pool);
        $this.after(wrap);
        $wrap = $(wrap);
        $this.data('csb-$wrap', $wrap);
        $csb_single = $(csb_single);
        $this.data('csb-$csb_single', $csb_single);
        $csb_single.on('mousedown', function (event) {
            if (event.which === 1) {
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
        $csb_drop = $(csb_drop);
        $csb_drop.on('mousedown', function (event) {
            event.stopPropagation();
        });
        // Start $this-a-thon
        $.data(wrap, '$this', $wrap);
        $.data(csb_single, '$this', $csb_single);
        $.data(csb_label, '$this', $csb_label);
        $.data(csb_drop, '$this', $csb_drop);
        // End $this-a-thon
        $csb_drop.on('mousedown', 'li.active-result', function (event) {
            var option_index;
            if (event.which === 1) {
                option_index = $.data(this, 'csb-option-index');
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
                $this.prop('selectedIndex', option_index).trigger('change');
                csb_label.textContent = this.textContent;
                //console.log(option_index);
                closeCSB(event);
            }
        });
        // return the newly created elements
        return wrap;
    }
    function eacher() {
        var $this, options, key;
        if (this.tagName.toLowerCase() === 'select') {
            options = eacher.options || eacher.default_options;
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
    eacher.default_options = { 'min-width': '50px' };
    extend_options = {
        customSelectBox: function customSelectBox(options) {
            if (!options) {
                if (Object.prototype.hasOwnProperty.call(eacher, 'options')) {
                    delete eacher.options;
                }
            } else {
                eacher.options = options;
            }
            this.each(eacher);
            return this;
        }
    };
    $.fn.extend(extend_options);
}(jQuery));
