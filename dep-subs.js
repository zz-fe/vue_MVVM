//发布订阅  订阅 在有发布  [fn1,fn2]

//绑定的方法都有一个update属性
function Dep (){
  this.subs = []  //订阅器
}
//订阅
Dep.prototype.addSub = function(sub) {
   this.subs.push(sub)
}
//通知
Dep.prototype.notify = function() {
   this.subs.forEach(sub => sub.update())
}

//Watcher 是一个类 通过这个类创建的实例都拥有update方法
function Watcher(vm,exp,fn){
   this.vm = vm
   this.exp = exp
   this.fn = fn         //添加到订阅中
   Dep.target = this
   var val  = vm
   var arr = exp.split('.');
   arr.forEach(function(key){
       val = val[key]
   })
   Dep.target = null
}
Watcher.prototype.update = function() {
  var val  = this.vm
  var arr = this.exp.split('.');
  arr.forEach(function(key){
      val = val[key]
  })
    this.fn(val);
}

// var watcher = new Watcher(function() {
//     console.log('公总号:前端架构之路')
// })

// var dep = new Dep

// dep.addSub(watcher)
// dep.addSub(watcher)
//
// dep.notify();
