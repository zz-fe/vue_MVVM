# MVVM  

## 更多精彩文章 请关注作者的公众号：'前端架构之路'，听大咖们聊聊前端 

#### 本文github地址 https://github.com/zz-fe/vue_MVVM

### 双向数据绑定  model view viewModel  

1.angular 脏值检查 $watch()  $apply()/ $digest(),

2.vue 数据劫持 + 发布订阅模式 (不兼容低版本)


vue 不兼容低版本的原因是因为 低版本浏览器不兼容Object.defineProperty这个属性 我们首先了解一下这个属性  正常中我们定义一个对象

```
   var obj = {}
   obj.公众号 =  '前端架构之路',
   //console.log(obj) {"公众号","前端架构之路"}
   delect obj.公众号
   //console.log(obj) {}
```
然后如果我们用到了Object.defineProperty 这个属性你就会发现不同了,需要配置一下参数才能达成以上的需求

```
  var  obj  = {};
    Object.defineProperty(obj, '公众号',{
      configurable:true,  //属性值可以被删除
      writable:true,  //对属性可进行编写
      enumerable: true, //可枚举
      value:'前端架构之路'
    })

```

首先我们要了解这些属性 然后我们在进行值修改,但有的时候我们会用到 get set方法 跟vue当的一样

```
 var  obj  = {};
    Object.defineProperty(obj, '公众号',{
      configurable:true,  //属性值可以被删除
      enumerable: true, //可枚举
      get() {
        //获取obj.公众号值得时候 会调用get方法
        return '前端架构之路'
      }
      set() {
        //给obj 属性赋值
      }
    })
console.log(obj.公众号)  //前端架构之路

```

我们通常写vue的时候 都会这样

```
<body>
  <div id="app">
      {{gongzhonghao}}
  </div>
</body>

<script>
    let mvvm = new Mvvm({
        el: '#app',
        data:{ gongzhonghao:'前端架构之路'}
    })

</script>

```


那么如何去实现呢？ 我们用这个Object.defineProperty 这个属性来实现数据劫持(observer)


```

数据劫持 观察对象给递归给每一个对象增加Object.definePropery 通过set方法触发 就能监听到了数据的变化,如果数据类型是{a:{b:1}} 多层的 那么就要用到递归去实现。


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



### vue中的数据代理   

在项目中 我们会遇到一些比较复杂的数据结构 例如 data:{ gongzhonghao:'前端架构之路', msg:{vx:214464812,creator: 'zhangzhen' }}  如果你用的我上面写的observe 方法的话 就会发现 我要获取creator 字段的话 需要通过mvvm._data.msg.creator   ..... 如果复杂的数据结构很多的话 就会很乱 需要通过mvvm.msg方式来获取数据(去掉_data)
那么就要用到数据代理的方式来处理以上问题 。其中this代表的是整个数据


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
vue特点 不能新增不存在的属性   不存在的属性没有get set 。
深度响应 因为每次赋予一个新对象 会增加数据截止


### 模板编译Compile

模板编译是把我们通过{{}}中的属性值 用我们的data去替换  首先我们通过#el 来确定编译的范围，创建createDocumentFragment 在内存中去更换我们的模板 减少DOM操作，通过nodeType 来判断当前的节点，利用
正则来匹配{{}} 通过递归的方式来更换每一个数据


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


### 发布订阅模式(重点)

以上的操作已经完成了一个简单的数据与模板的绑定,那么大家关心的数据驱动该如何实现？
当一个值发生变化的时候 视图也发生变化 这就需要我们去订阅一些事件
ep.addSub(Dep.target) 是增加订阅 , dep.notify函数 是发布事件
当值发生改变的时候我们去发布这个事件(调用dep.notify()）

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

#### 1.如何去订阅一些事件  

说到订阅 那么问题来了，谁是订阅者？怎么往订阅器添加订阅者？ 在dep-subs.js中我指定了 Wathcher是订阅者
首先要增加Wathcher是订阅者 把订阅者放到订阅器(subs)中  当值发生变化的时候 订阅器就会调用update 方法去发布一些事件。


##### (1)增加订阅  


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
##### (2)发布订阅

```
//通知
Dep.prototype.notify = function() {
   this.subs.forEach(watcher => watcher.update())
}


```
##### (3) 观察者

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

#### (4) 发布之后 修改模板
当我们调用dep.notify()的时候 其实就是调用update方法 在compile.js中模板重新赋值


```
  发布订阅模式开启
  new Watcher(vm, RegExp.$1, function(newValue){
    node.textContent = text.replace(reg,newValue)
  })

```

以上4步完事之后，就可以实现了vue当中的发布订阅模式

### 如何实现input 标签当中的v-model 

```
   <input type="text" v-model='gongzhonghao'>

```

  在编译的时候我要要判断节点 当nodeType == 1 的时候 我们获取DOM的属性来判断type类型 如果是我们想要的v-model 的话我们去就监听当前元素 并开启发布订阅模式去监听变化

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
### 如何使用computed计算时进行缓存处理

在工作当中很多面试的人都会去问computed计算与methods的计算 有什么区别 ?

methods是一种交互方法，通常是把用户的交互动作写在methods中；而computed是一种数据变化时mvc中的module 到 view 的数据转化映射。
简单点讲就是methods是需要去人为触发的，而computed是在检测到data数据变化时自动触发的，还有一点就是，性能消耗的区别，这个好解释。
首先，methods是方式，方法计算后垃圾回收机制就把变量回收，所以下次在要求解筛选偶数时它会再次的去求值。而computed会是依赖数据的，就像闭包一样，数据占用内存是不会被垃圾回收掉的，所以再次访问筛选偶数集，不会去再次计算而是返回上次计算的值，当data中的数据改变时才会重新计算。简而言之，methods是一次性计算没有缓存，computed是有缓存的计算。其实代码实现起来很是简单 

首先要是去获取当前computed值。

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
### 实现一个MVVM 

MVVM作为数据绑定的入口，整合Observer、Compile和Watcher三者，通过Observer来监听自己的model数据变化，通过Compile来解析编译模板指令，最终利用Watcher搭起Observer和Compile之间的通信桥梁，达到数据变化 -> 视图更新；视图交互变化(input) -> 数据model变更的双向绑定效果。 

```
    let mvvm = new Mvvm({
        el: '#app',
        data:{ gongzhonghao:'前端架构之路', msg:{vx:214464812,creator: 'zhangzhen' }},
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
vue中的MVVM 这里主要还是利用了Object.defineProperty()这个方法来劫持了vm实例对象的属性的读写权，使读写vm实例的属性转成读写了this._data的属性值，

### 总结 

本文主要围绕着 实现Observer , Compile , computed ,proxyData 几个方式 并且根据自己的思路来实现的,有问题可以联系我 VX:<span style='color:red'>zz214464812</span> 或在公总号：<span style='color:red'>"前端架构之路上"</span> 联系我  


