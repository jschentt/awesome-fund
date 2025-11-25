// CSS模块类型声明，解决TypeScript无法识别CSS导入的问题
declare module '*.css' {
    const content: any;
    export default content;
}
