$(function () {
    dataTableId = $("table").attr("id");
    /**
     * 存储选择器(指定表格的表头)
     * @type {*|jQuery.fn.init|jQuery|HTMLElement}
     */
    var table = $("#" + dataTableId + " th");
    // 给页面增加过滤条件窗口div
    if ($(".filtrate-box").length === 0) {
        $(document.body).append("<div class='filtrate-box'></div>");
    }
    // 禁止条件过滤窗口的右击事件
    $(".filtrate-box").bind("contextmenu", function () {
        return false;
    });
    // 禁止表头的右击事件
    table.bind("contextmenu", function () {
        return false;
    });
    // 判断鼠标左/右击
    table.mousedown(function (e) {
        if (3 === e.which) {
            addSearchFrame($(this).index());
        } else if (1 === e.which) {
            tableSort($(this).index());
        }
    });
    dragPanelMove(".filtrate",".filtrate-box");
        function dragPanelMove(downDiv,moveDiv){
            $(downDiv).mousedown(function (e) {
                    var isMove = true;
                    var div_x = e.pageX - $(moveDiv).offset().left;
                    var div_y = e.pageY - $(moveDiv).offset().top;
                    $(document).mousemove(function (e) {
                        if (isMove) {
                            var obj = $(moveDiv);
                            obj.css({"left":e.pageX - div_x, "top":e.pageY - div_y});
                        }
                    }).mouseup(
                        function () {
                        isMove = false;
                    });
            });

        }
});
/**
 * table的id
 * @type {string}
 */
var dataTableId = "";
/**
 * 表头每个列选中的过滤条件
 * @type {{}}
 */
var filterMap = {};
/**
 * 保存过滤后的dom结果
 * @type {Array}
 */
var domGroupList = [];
/**
 * 点击的表头队列
 * @type {Array}
 */
var tableCheckedIdList = [];
/**
 * 是否过滤
 * @type {boolean}
 */
var toDoSelect = true;

/**
 * 通过右击的表头生成条件过滤窗口
 * @param index 表头元素id
 */
function addSearchFrame(index) {
    toDoSelect = false;
    /**
     * 存储选择器(条件过滤窗口);
     * @type {*|jQuery.fn.init|jQuery|HTMLElement}
     */
    var filtrateBox = $(".filtrate-box");
    /**
     * 条件过滤窗口的html代码
     * @type {string}
     */
    var html = "";
    // 将表格tbody部分通过点击的表头td进行排序
    var domList = $("#" + dataTableId + ">tbody>tr").find("td:eq(" + index + ")").sort(function (dom1, dom2) {
        if (/^[0-9]+$/.test($(dom1).text()) && /^[0-9]+$/.test($(dom2).text())) {
            return Number($(dom1).text()) - Number($(dom2).text());
        } else {
            return $(dom1).text() > $(dom2).text() ? 1 : -1;
        }
    });
    /**
     * 记录当前td的数据
     * @type {string}
     */
    var preText = "";
    // 去重
    domList.each(function () {
        if (preText === "" || preText !== $(this).text()) {
            html += "<li><input type='checkbox' value=" + $(this).text() + " name='filter' onclick='unChecked()'>" +
                "<span>" + $(this).text() + "</span></li>";
        }
        preText = $(this).text();
    });
    // 生成拼接用的html代码
    var innerHTML = "<div id='searchFilterDiv'>" +
        "<input type='search' value='' height='50px' placeholder='搜索' onkeyup='searchFilterByInput()'>" +
        "</div>" +
        "<div class='filtrate'>" +
        "<ul>" +
        "<li><input type='checkbox' value='checkedAll' onclick='allChecked()' id='allChecked'><span>全选</span></li>" +
        html +
        "</ul>" +
        "</div>" +
        "<div class='searchBtn'>" +
        "<input class='btn' type='submit' name='submit' value='确 定' onclick='selectData(" + index + ")'>" +
        "<input class='btn after' type='button' name='cancel' value='取 消' onclick='frameClose()'>" +
        "</div>";
    // 初始化
    filtrateBox.text("");
    filtrateBox.append(innerHTML);
    // 对选中的过滤条件进行还原
    if (filterMap[index] != null) {
        $(".filtrate>ul").find("input").each(function () {
            var domValue = $(this);
            filterMap[index].forEach(function (value) {
                if (value === domValue.val()) {
                    domValue.attr("checked", "true");
                }
            })
        });
    }
    filtrateBox.css("left", document.body.scrollLeft + event.clientX + 1);
    filtrateBox.css("top", document.body.scrollLeft + event.clientY + 10);
    filtrateBox.show();
}

/**
 * 全选框的全选/反选
 */
function allChecked() {
    var inputDom = $("input[name='filter']");
    inputDom.each(function () {
        if (!$(this).is(":hidden")) {
            $(this).prop("checked", true);
        }
    })
    if ($('.filtrate input[type=checkbox]:not(:checked)').length === 1) {
        inputDom.prop("checked", false);
    }
    toDoSelect = true;
}

/**
 * 反选全选框
 */
function unChecked() {
    $(".filtrate #allChecked").prop("checked", false);
    toDoSelect = true;
}

/**
 * 通过输入值和获取的value进行匹配
 * @param domValue
 * @param inputVal
 * @returns {number} 0:不存在 >0:存在
 */
function countSubstr(domValue, inputVal) {
    var reg = new RegExp(inputVal, "g");
    return domValue.match(reg) ? domValue.match(reg).length : 0;
}

/**
 * 通过输入内容筛选条件
 */
function searchFilterByInput() {
    var inputVal = $("#searchFilterDiv input[ type='search' ] ").val();
    $('.filtrate li').each(function () {
        var domValue = $(this).find("input").val();
        if (countSubstr(domValue, inputVal) > 0) {
            $(this).show();
        } else {
            if ($(this).text() !== "全选") {
                $(this).hide();
            }
        }
    })
}

/**
 * 删除
 * @param tableCheckedIdList
 * @param checkedIndex
 */
function deleteData(tableCheckedIdList, checkedIndex) {
    /**
     * 需要移除的数量
     * @type {number}
     */
    var howMany = tableCheckedIdList.length - checkedIndex;
    // 删除当前过滤条件之后的过滤条件
    for (var i = 0; i < tableCheckedIdList.length; i++) {
        if (i >= checkedIndex) {
            delete filterMap[tableCheckedIdList[i]];
        }
    }
    // 删除当前过滤条件之后的所有dom数据
    domGroupList.splice(checkedIndex, howMany);
    // 删除当前过滤条件之后的点击队列
    tableCheckedIdList.splice(checkedIndex, howMany);
}

/**
 * 通过表头id对表格数据进行过滤显示
 * @param index 表头id
 */
function selectData(index) {
    if (toDoSelect) {
        /**
         * 保存选中的选择器
         * @type {*|jQuery.fn.init|jQuery|HTMLElement}
         */
        var checkedDom = $('.filtrate input[type=checkbox]:checked');
        /**
         * 在条件过滤框里选中的条件
         * @type {Array}
         */
        var checkedDomList = [];
        /**
         * 需要显示的tr
         * @type {Array}
         */
        var toShowDomList = [];
        /**
         * 判断当前点击的表头是否之前已经过滤并得到下标
         * @type {number}
         */
        var checkedIndex = tableCheckedIdList.indexOf(index);
        var isUncheckedFilter = checkedIndex > -1 && checkedDom.length === 0;
        // 撤销之前的筛选
        if (isUncheckedFilter) {
            deleteData(tableCheckedIdList, checkedIndex);
            index = tableCheckedIdList[tableCheckedIdList.length - 1];
            checkedDom = filterMap[index];
            // 如果之前已经筛选
        } else if (checkedIndex > -1) {
            deleteData(tableCheckedIdList, checkedIndex);
        }

        /**
         * 控制过滤结果和点击队列的新增
         * @type {boolean}
         */
        var isPush = true;
        /**
         * 是否隐藏
         * @type {boolean}
         */
        var isHide = true;
        // 第二次过滤数据(通过点击队列判断)
        if (JSON.stringify(filterMap) !== JSON.stringify({})) {
            if (isUncheckedFilter) {
                checkedDom.forEach(function (value) {
                    var checkedValue = value;
                    $("#" + dataTableId + ">tbody>tr").each(function () {
                        var thisValue = $(this).find("td:eq(" + index + ")").text().replace(/\s*/g, "");
                        if (isHide) {
                            $(this).hide();
                        }
                        if (checkedValue === thisValue) {
                            $(this).show();
                        }
                    });
                    isHide = false;
                });
            } else {
                checkedDom.each(function () {
                    var checkedValue = $(this).val();
                    checkedDomList.push(checkedValue);
                    domGroupList[domGroupList.length - 1].forEach(function (value) {
                        var thisValue = value.find("td:eq(" + index + ")").text().replace(/\s*/g, "");
                        if (isHide) {
                            value.hide();
                        }
                        if (checkedValue === thisValue) {
                            value.show();
                            toShowDomList.push(value);
                        }
                    });
                    isHide = false;
                });
            }
            // 第一次过滤
        } else {
            if (isUncheckedFilter) {
                $("#" + dataTableId + ">tbody>tr").each(function () {
                    $(this).show();
                });
            } else {
                checkedDom.each(function () {
                    var checkedValue = $(this).val();
                    checkedDomList.push(checkedValue);
                    $("#" + dataTableId + ">tbody>tr").each(function () {
                        var thisValue = $(this).find("td:eq(" + index + ")").text().replace(/\s*/g, "");
                        if (isHide) {
                            $(this).hide();
                        }
                        if (checkedValue === thisValue) {
                            $(this).show();
                            toShowDomList.push($(this));
                        }
                    });
                    isHide = false;
                });
            }
        }
        // 保存需要显示的tr和表头id
        if (checkedDomList.length > 0) {
            filterMap[index] = checkedDomList;
        }
        // 每种过滤条件只能保存一次
        if (toShowDomList.length > 0) {
            tableCheckedIdList.forEach(function (value) {
                if (value === index) {
                    isPush = false;
                    domGroupList.push(toShowDomList);
                }
            });
        }
        // 保存点击队列和过滤结果
        if (isPush || toShowDomList.length > 1) {
            tableCheckedIdList.push(index);
            domGroupList.push(toShowDomList);
        }
        frameClose();
    } else {
        frameClose();
    }
}

/**
 * 关闭条件过滤窗口
 */
function frameClose() {
    $(".filtrate-box").hide();
}

/**
 * 判断正序还是倒序排列
 * @type {boolean}
 */
var desc = false;

/**
 * 鼠标左击表头排序
 * @param index 表头th的id
 */
function tableSort(index) {
    var num1 = 1;
    var num2 = -1;
    var domList = $("#" + dataTableId + ">tbody>tr");
    domList.sort(function (a, b) {
        if (/^[0-9]+$/.test($(a).find("td:eq(" + index + ")").text()) && /^[0-9]+$/.test($(b).find("td:eq(" + index + ")").text())) {
            if (!desc) {
                return Number($(b).find("td:eq(" + index + ")").text()) - Number($(a).find("td:eq(" + index + ")").text());
            } else {
                return Number($(a).find("td:eq(" + index + ")").text()) - Number($(b).find("td:eq(" + index + ")").text());
            }
        } else {
            if (!desc) {
                num1 = -1;
                num2 = 1;
            }
            return $(a).find("td:eq(" + index + ")").text() < $(b).find("td:eq(" + index + ")").text() ? num1 : num2;
        }
    });
    desc = !desc;
    $("#" + dataTableId + ">tbody").remove();
    $("#" + dataTableId).append(domList);
}