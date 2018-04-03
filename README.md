# MVVM  

## 更多精彩文章 请关注作者的公众号：'内推猿'，跟随大咖们团队,定期分享技术与招聘信息！~~ 

#### 本文github地址 https://github.com/zz-fe/vue_MVVM


### 前言

随着 Vue2.0 的发布，前端入门的要求也越来越低，已至于 Vue 已经成为一个前端的标配，最近也面了很多前端开发工程师，发现大部分都停留在用的阶段上，建议大家看看源码，学学 Vue 的思想。

本文中，读者配合作者的 GitHub 去实践，相信会有很大的提升。

<font color=red>
### 双向数据绑定 Model View ViewModel  

1. Angular1.x当中的双向数据绑定是通过 监听的方式来出来的，核心思想为脏值检查,angular 通过$watch()去监听值然后调用  $apply()/ $digest()方法来实现的。

2. Vue 数据劫持 + 发布订阅模式（不兼容低版本）+ 数据代理；
</font> 

#### 今天主要讲 Vue

Vue 不兼容低版本，是因为低版本浏览器不兼容 Object.defineProperty 这个属性，我们首先了解一下正常情况下定义的对象。

```
   var obj = {}
   obj.公众号 =  '内推猿',
   //console.log(obj) {"公众号","内推猿"}
   delect obj.公众号
   //console.log(obj) {}
```

如果我们用到了 Object.defineProperty 这个属性再去定义一个对象，在控制台中你就会发现不同了， 在原型链上多了一些方法。

```
  var  obj  = {};
    Object.defineProperty(obj, '公众号',{
      configurable:true,  //属性值可以被删除
      writable:true,  //对属性可进行编写
      enumerable: true, //可枚举
      value:'内推猿'
    })

```

想要了解这些属性的全部参数的话，可以去 MDN 上查看一下。我们在进行值修改的时候，就会用到 get、set方法。

```
 var  obj  = {};
    Object.defineProperty(obj, '公众号',{
      configurable:true,  //属性值可以被删除
      enumerable: true, //可枚举
      get() {
        //获取obj.公众号值得时候 会调用get方法
        return '内推猿'
      }
      set() {
        //给obj 属性赋值
      }
    })
console.log(obj.公众号)  //内推猿

```

我们通常写 Vue 的时候，都会这样写：

```
<body>
  <div id="app">
      {{gongzhonghao}}
  </div>
</body>

<script>
    let mvvm = new Mvvm({
        el: '#app',
        data:{ gongzhonghao:'内推猿'}
    })

</script>

```


那么如何去实现呢？我们用这个 Object.defineProperty 这个属性来实现数据劫持（Observer）。

数据劫持：观察对象，通过递归给每一个对象增加 Object.definePropery，在 set 方法中触发 observe 方法，就能监听到数据的变化，如果数据类型是 `{a:{b:1}}`多层的，那么就要用到递归去实现。

```
function observe (data) {
    return new Observe(data)
}

function Observe (data) {
    if(!data || typeof data !== 'object')  return
    //把data属性 通过Object.definePropert  来定义属性
    for (let key in data) {   
        let value = data[key]  
        //递归方式绑定所有属性    数据是 {a:{b:1}}
        observe(value)
        Object.defineProperty(data, key, {
            enumerable:true,
            get() {
                return value
            },
            set(newValue) {
                //如果值没有发生改变的话  
                if(newValue  == value) return
                //重新赋值
                value = newValue
                observe(value)
            },
        })
    }
}


```

### Vue 中的数据代理   


我们会遇到一些比较复杂的数据结构，例如 `data:{ gongzhonghao:'内推猿', msg:{vx:214464812,creator: 'zhangzhen' }}`。

如果你用的是我上面写的 observe 方法就会发现，我要获取 creator 字段的话，需要通过 `mvvm._data.msg.creator ..... ` 的形式来获取值。遇到再复杂的数据结构就会更乱。然而我们想要通过 `mvvm.msg` 方式来获取数据（去掉_data）。去掉复杂的查询方式，所以用到了数据代理的方式来处理以上问题，其中 this 代表的是整个数据。


```
   //数据代理方式
   for(let key in data ) {
     Object.defineProperty(this, key ,{
        enumerable:true,
        get() {
            return this._data[key];
        },
        set(newValue){
            this._data[key] = newValue
        }
     })
   }

```
Vue特点，不能新增不存在的属性 ，因为不存在的属性没有 get、set 方法。而vue当中的深度响应，会给每一个新对象增加数据劫持，从而去监控新对象的变化。


### 模板编译 Compile

Vue 项目中我们通过 `{{}}` 的方式来替换 data 值，首先我们通过 `#el` 来确定编译的范围，创建 `createDocumentFragment` 标签，在内存中去更换我们的模板减少 DOM 操作，通过 nodeType 来判断当前的节点，利用正则来匹配 `{{}}` 通过递归的方式来更换每一个数据。

```
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

```

### 发布订阅模式（重点）

以上的操作已经完成了一个简单的数据与模板的绑定，那么大家关心的数据驱动该如何实现？当一个值发生变化的时候视图也发生变化，这就需要我们去订阅一些事件。

ep.addSub(Dep.target) 是增加订阅，dep.notify 函数是发布事件。当值发生改变的时候我们去发布这个事件（调用dep.notify()）。

```
observe(value)
Object.defineProperty(data, key, {
    enumerable:true,
    get() {
        console.log(Dep.target)  
        Dep.target && dep.addSub(Dep.target)  //[增加watcher]
        return value
    },
    set(newValue) {
        //如果值没有发生改变的话
        if(newValue  == value) return
        //重新赋值
        value = newValue
        observe(value)
        dep.notify()  //让所有的watcher的update 执行
    },
})

```

#### 如何去订阅一些事件  

说到订阅，那么问题来了，谁是订阅者？怎么往订阅器添加订阅者？在 dep-subs.js 中我指定了  Wathcher 是订阅者。首先要增加 Wathcher 是订阅者，把订阅者放到订阅器（subs）中当值发生变化的时候，订阅器就会调用 update 方法去发布一些事件。


##### **增加订阅**  


```
  //绑定的方法都有一个update属性
  function Dep (){
    this.subs = []  //订阅器
  }
  //增加订阅
  Dep.prototype.addSub = function(watcher) {
     this.subs.push(watcher)
  }

```
##### **发布订阅**

```
//通知
Dep.prototype.notify = function() {
   this.subs.forEach(watcher => watcher.update())
}


```
##### **观察者**

```
function Watcher(vm,exp,fn){
   this.vm = vm
   this.exp = exp
   this.fn = fn         //添加到订阅中
   Dep.target = this
   var val  = vm
   var arr = exp.split('.');
   arr.forEach(function(key){
       val = val[key]
   })     //在这里调用objectDefineProperty中get方法
   Dep.target = null
}
Watcher.prototype.update = function() {
  //获取新值
  var val  = this.vm
  var arr = this.exp.split('.');
  arr.forEach(function(key){
      val = val[key]
  })
  this.fn(val);
}

```

#### 发布之后，修改模板

当我们调用 dep.notify() 的时候，其实就是调用 update 方法，在 compile.js 中模板重新赋值。


```
  发布订阅模式开启
  new Watcher(vm, RegExp.$1, function(newValue){
    node.textContent = text.replace(reg,newValue)
  })

```

以上4步完事之后，就可以实现了 Vue 当中的发布订阅模式。

### 如何实现 input 标签当中的v-model 


```

 <input type="text" v-model='gongzhonghao'>

```

在编译的时候我们要判断节点，当 nodeType == 1 的时候，我们获取 DOM 的属性来判断 type 类型，如果是我们想要的 v-model 的话我们就去监听当前元素，并开启发布订阅模式去监听变化。

```
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

```

### 如何使用 computed 计算时进行缓存处理

在面试的时候很人面试官都会问 computed 计算与 methods 的计算有什么区别？

methods 是一种交互方法，通常是把用户的交互动作写在 methods 中；而 computed 是一种数据变化时 MVVM 中的 module 到 view 的数据转化映射。

简单点讲，methods 是需要人为触发的，而 computed 是在检测到 data 数据变化时自动触发的，还有一点就是，性能消耗的区别，这个好解释。

首先，methods 是方式，方法计算后垃圾回收机制就把变量回收，所以下次在要求计算的时候它会再次去求值。而 computed 是依赖数据的，就像闭包一样，数据占用内存是不会被垃圾回收掉的，所以再次计算的时候，不会再次计算而是返回上次计算的值，当 data 中的数据改变时才会重新计算。简而言之，methods 是一次性计算没有缓存，computed 是有缓存的计算。其实代码实现起来很是简单 

首先要是去获取当前 computed 值。

```

function computed() { //具有缓存功能
    let computed = this.$options.computed;  // {key:value}
    let self = this
    Object.keys(computed).forEach(function(key){   //拿到key 值
      Object.defineProperty(self, key,{
        get: typeof computed[key] === 'function' ?  computed[key] : computed[key].get,
        set(){},
      })
    })
}

```
### 实现一个 MVVM 

MVVM 作为数据绑定的入口，整合 Observer、Compile 和 Watcher 三者，通过 Observer 来监听自己的 Model 数据变化，通过 Compile 来解析编译模板指令，最终利用 Watcher 搭起 Observer 和 Compile 之间的通信桥梁，达到数据变化 -> 视图更新，视图交互变化（input） -> 数据 Model 变更的双向绑定效果。 

```
    let mvvm = new Mvvm({
        el: '#app',
        data:{ gongzhonghao:'内推猿', msg:{vx:214464812,creator: 'zhangzhen' }},
        //computed 可以缓存 只是把数据挂在mvvm上
        computed:{
          say(){
            return this.gongzhonghao  + '--------' + this.msg.creator
          }
        }
    })

```

```
function Mvvm(options = {}) {
    //将所有的数据绑定在$options
   this.$options = options

   var data = this._data = this.$options.data;
   //增加发布订阅
   observe(data)

   //数据代理方式
   proxyData(data,this)
   //计算
   computed.call(this)
   //模板编译
   compile(options.el,this)
}

``` 
Vue 中的 MVVM，这里主要还是利用了 Object.defineProperty() 这个方法来劫持了 vm 实例对象的属性的读写权，使读写 vm 实例的属性转成读写了 this._data 的属性值。

### 总结 

本文主要围绕着实现 Observer、Compile、computed 、proxyData 几个方式展开，并分享了自己的研发思路，大家有问题可以在读者圈留言，也可以联系我（微信号：zz214464812）或在公众号（内推猿），联系我们团队。

本文代码：请见 [GitHub](https://github.com/zz-fe/vue_MVVM)。

