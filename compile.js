/**
 * 
 * @param {替换的范围} el 
 * @param {this} vm 
 */

function Compile(el,vm) {
  vm.$el = document.querySelector(el);
  var Fragment = document.createDocumentFragment();
  //把模板放入内存当中
  while (child = vm.$el.firstChild) {
    Fragment.appendChild(child)
  } 
  replace(Fragment,vm)
  vm.$el.appendChild(Fragment)
}

function replace (Fragment,vm){
    //类数组转化成数组
  Array.from(Fragment.childNodes).forEach(function(node){
    var text = node.textContent ;
    var reg = /\{\{(.*)\}\}/;
    if(node.nodeType == '3' && reg.test(text)) {
        //console.log(RegExp.$1) 
        let ary = RegExp.$1.split('.') 
        //console.log(ary)  [msg, vx]   
        let val = vm  
        ary.forEach(function(key){  //取this.msg  /this.gongzhonghao 
            val = val[key]
        });
        node.textContent = text.replace(reg,val)
    }
    if(node.childNodes){
        replace(node,vm)
    }
  })
}

function compile(el,vm) {
    return new Compile(el,vm)
}