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
    var $document = $(document), list_of_csb = [];
    function createSelectBoxStructure($this) {
        var wrap = document.createElement('div'),
            $wrap,
            csb_single,
            $csb_single,
            csb_label,
            $csb_label,
            csb_drop,
            $csb_drop,
            csb_arrow,
            csb_option_list,
            $active_result,
            optgroup,
            // children contains all options and optgroups of a given select element. used in generating the list items of the proxy
            children = [],
            list_pool,
            selected_item = null,
            index = 0;
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
        function closeCSB() {
            csb_single.parentNode.classList.remove('csb-with-drop');
            csb_single.parentNode.classList.remove('csb-container-active');
            $document.off('mousedown', closeCSB);
        }
        function openCSB() {
            var i, length = list_of_csb.length;
            for (i = 0; i < length; i += 1) {
                list_of_csb[i].trigger('csb:close-proxy');
            }
            csb_single.parentNode.classList.add('csb-with-drop');
            csb_single.parentNode.classList.add('csb-container-active');
            $document.on('mousedown', closeCSB);
        }
        $this.on('csb:close-proxy', closeCSB);
        $this.on('csb:open-proxy', openCSB);
        // this is where the list elements get created/recycled
        list_pool = (function listPoolSetup() {
            var pool = [];
            window.pool = pool;
            return {
                'summon': function summon() {
                    var list;
                    if (pool.length > 0) {
                        return pool.pop();
                    }
                    list = document.createElement('li');
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
                            item.removeAttribute('data-csb-option-index');
                            pool.push(item);
                        }
                    }
                }
            };
        }());
        wrap.classList.add('csb-container');
        wrap.classList.add('csb-container-single');
        if ($this.prop('disabled')) {
            wrap.classList.add('csb-disabled');
        }
        csb_single = document.createElement('div');
        csb_single.classList.add('csb-single');
        csb_label = document.createElement('span');
        csb_label.classList.add('csb-label');
        csb_single.appendChild(csb_label);
        csb_arrow = document.createElement('span');
        csb_arrow.classList.add('csb-arrow');
        csb_single.appendChild(csb_arrow);
        wrap.appendChild(csb_single);
        // bottom
        csb_drop = document.createElement('div');
        csb_drop.classList.add('csb-drop');
        csb_option_list = document.createElement('ul');
        csb_option_list.classList.add('csb-option-list');
        function createDropdownStructure() {
            var i, length, li;
            for (i = 0, length = children.length; i < length; i += 1) {
                li = list_pool.summon();
                switch (children[i].tagName.toLowerCase()) {
                case 'optgroup':
                    optgroup = children[i];
                    li.classList.add('group-result');
                    li.textContent = children[i].label;
                    break;
                case 'option':
                    if (!children[i].hasAttribute('disabled')) {
                        li.classList.add('active-result');
                    } else {
                        li.classList.add('disabled-result');
                    }
                    //li.setAttribute('data-csb-option-index', index);
                    li.dataset.csbOptionIndex = index;
                    if (optgroup && children[i].parentNode === optgroup) {
                        li.classList.add('group-option');
                    }
                    li.textContent = children[i].textContent;
                    //console.log($this[0].name);
                    if (children[i].value === $this[0].value && index === $this[0].selectedIndex) {
                        if ($this[0].selectedIndex === 0 && i === 0) {
                            csb_single.classList.add('csb-default');
                        }
                        csb_label.textContent = li.textContent;
                        li.classList.add('csb-selected');
                        selected_item = li;
                        if (children[i].hasAttribute('disabled')) {
                            csb_single.classList.add('csb-default');
                            li.classList.add('disabled-result');
                        }
                    }
                    /*
                    if (!selected_item) {
                        if (i === 0) {
                            csb_single.classList.add('csb-default');
                        }
                        if (index === 0) {
                            //csb_single.classList.add('csb-default');
                            csb_label.textContent = li.textContent;
                            li.classList.add('csb-selected');
                            selected_item = li;
                            if (children[i].hasAttribute('disabled')) {
                                csb_single.classList.add('csb-default');
                                li.classList.add('disabled-result');
                            }
                        }
                    } else {
                        if ($this[0].value === children[i].value) {
                            if (i === 0 || children[i].hasAttribute('disabled')) {
                                csb_single.classList.add('csb-default');
                            }
                            csb_label.textContent = li.textContent;
                            li.classList.add('csb-selected');
                            selected_item = li;
                        }
                    }
                    */
                    index += 1;
                    break;
                }
                li.dataset.csbOptionRawIndex = i;
                csb_option_list.appendChild(li);
            }
        }
        createDropdownStructure();
        csb_drop.appendChild(csb_option_list);
        wrap.appendChild(csb_drop);
        $this.data('csb:update-proxy-structure', function () {
            list_pool.shave(csb_option_list);
            updateChildren();
            csb_single.classList.remove('csb-default');
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
            event.stopPropagation();
            if ($this[0].hasAttribute('disabled')) {
                return;
            }
            if (!csb_single.parentNode.classList.contains('csb-with-drop')) {
                openCSB();
            } else {
                closeCSB();
            }
        });
        $csb_label = $(csb_label);
        $this.data('csb-$csb_label', $csb_label);
        $csb_drop = $(csb_drop);
        $this.data('csb-$csb_drop', $csb_drop);
        $active_result = $wrap.find('li.active-result');
        $this.data('csb-$active_result', $active_result);
        $csb_drop.on('mousedown', function (event) {
            event.stopPropagation();
        });
        $csb_drop.on('mousedown', 'li.active-result', function () {
            var option_index = parseInt(this.dataset.csbOptionIndex, 10), item_index = parseInt(this.dataset.csbOptionRawIndex, 10);
            if (item_index > 0) {
                csb_single.classList.remove('csb-default');
            } else {
                csb_single.classList.add('csb-default');
            }
            selected_item.classList.remove('csb-selected');
            selected_item = this;
            this.classList.add('csb-selected');
            $this.prop('selectedIndex', option_index).trigger('change');
            csb_label.textContent = this.textContent;
            //console.log(option_index);
            //console.log(this.dataset.csbOptionIndex);
            closeCSB();
        });
        $wrap.css('min-width', $csb_drop.width() + parseInt(csb_arrow.style.width, 10) + 'px');
        console.log($wrap);
        // return the newly created elements
        return wrap;
    }
    function eacher() {
        var $this, options = eacher.options, key;
        if (this.tagName.toLowerCase() === 'select') {
            if (!$.data(this, 'csb-$this')) {
                $this = $(this);
                list_of_csb.push($this);
                $.data(this, 'csb-$this', $this);
                //$.data(this, 'csb-$children', $this.find('optgroup, option'));
                $.data(this, 'csb-proxy', createSelectBoxStructure($this));
                for (key in options) {
                    if (options.hasOwnProperty(key)) {
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
                    if (this.selectedIndex === -1) {
                        $this.data('csb-$csb_label').text(this.dataset.placeholder);
                    } else {
                        $this.data('csb-$csb_label').text($this[0].value);
                    }
                    if ($this[0].hasAttribute('disabled')) {
                        $this.data('csb-$wrap')[0].classList.add('csb-disabled');
                    } else {
                        $this.data('csb-$wrap')[0].classList.remove('csb-disabled');
                    }
                    $this.data('csb:update-proxy-structure')();
                });
                // Start experiment
                Object.defineProperty($this.get(0), 'csbSelectedIndex', {
                    get: function getter() {
                        return this.selectedIndex;
                    },
                    set: function setter(value) {
                        this.selectedIndex = value;
                        $this.trigger('csb:update-proxy');
                        //$this.trigger('change');
                    }
                });
                // End experiment
                $this.hide();
            } else {
                $this = $.data(this, 'csb-$this');
            }
            console.log('Plugin is not ready');
        }
    }
    $.fn.extend({
        customSelectBox: function customSelectBox(options) {
            if (!options) {
                if (eacher.hasOwnProperty('options')) {
                    delete eacher.options;
                }
            } else {
                eacher.options = options;
            }
            this.each(eacher);
        }
    });
}(jQuery));
