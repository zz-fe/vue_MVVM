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
    //当前为文本的时候
    if(node.nodeType == '3' && reg.test(text)) {
        //console.log(RegExp.$1)
        let ary = RegExp.$1.split('.')
        //console.log(ary)  [msg, vx]
        let val = vm
        ary.forEach(function(key){  //取this.msg  /this.gongzhonghao
            val = val[key]
        });
        //发布订阅模式开启
        new Watcher(vm, RegExp.$1, function(newValue){
          node.textContent = text.replace(reg,newValue)
        })
        node.textContent = text.replace(reg,val)
    }
    //当前为标签的时候
    if(node.nodeType == '1'){
      var nodeAttrs = node.attributes //获取当前节点DOM属性
      //console.log(nodeAttrs)  //NamedNodeMap {0: type, 1: v-model, type: type, v-model: v-model, length: 2}
      Array.from(nodeAttrs).forEach((attr) => {
         var name = attr.name
         var key = attr.value  //v-model = 'value'
         if (name.indexOf('v-') == 0) {
           node.value = vm[key]
         }
         //发布订阅模式开启
         new Watcher(vm, key, function(newValue){
           node.value = newValue
         })

         node.addEventListener('input',function(e){
            var newValue = e.target.value
            vm[key] = newValue
         })
      })

    }
    if(node.childNodes){
        replace(node,vm)
    }
  })
}

function compile(el,vm) {
    return new Compile(el,vm)
}
