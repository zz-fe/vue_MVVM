/**
 * Created by zhangzhen on 17/12/30.
 */



function Mvvm(options = {}) {
    //将所有的数据绑定在$options 
   this.$options = options 

   var data = this._data = this.$options.data;

   observe(data) 
   //数据代理方式 
   proxyData(data,this)
   //模板编译
   compile(options.el,this)

}

