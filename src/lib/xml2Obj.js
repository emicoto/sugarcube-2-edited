const xml2Obj = function (obj) {
   const isText = (obj) => obj && obj["#text"] && Object.keys(obj).length === 1;
   const isLiArr = (obj) =>
      obj && obj.li && Object.keys(obj).length === 1 && Array.isArray(obj.li);
   const isLi = (obj) => obj && obj.li && Object.keys(obj).length === 1;

   const convertObj = function (obj, objname = "group") {
      const result = {};
      if (JSON.stringify(obj) == '{}') return ''

      for (let key in obj) {
         //convert li to array

         if (isLiArr(obj[key])) {
            result[key] = convertArr(obj[key].li, key);
         }
         //convert li obj to array
         else if (isLi(obj[key])) {
            let li = obj[key].li;
            result[key] = [convertObj(li, key)];
         }

         //delect #comment
         else if (key == "#comment") {
            continue;
         }

         //convert array
         else if (Array.isArray(obj[key])) {
            let _key = key;
            if (key === "li") {
               key = objname;
            }
            result[key] = convertArr(obj[_key], key);
         }

         //convert { #text: 'xxx' } to 'xxx', ensure no other key
         else if (isText(obj[key])) {
            result[key] = txt(obj[key]);
         }

         //convert { #text: 'xxx' } to  key: 'xxx', when has other key
         else if (key == "#text") {
            result[objname] = txt(obj[key]);
         }

         //if is object, convert it
         else if (typeof obj[key] === "object") {
            result[key] = convertObj(obj[key], key);
         }

         //other case
         else {
            result[key] = txt(obj[key]);
         }
      }

      return result;
   };

   //convert xxx||xxx to array, and convert number to number
   const arr = function (arg) {
      let arr = arg.split("||");
      //if the array is number, convert it to number
      arr = arr.map((item) => (!isNaN(item) ? Number(item) : item));
      return arr;
   };

   const boolen = function (arg) {
      return arg === "true";
   };

   //convert { #text: 'xxx' } to 'xxx'
   const txt = function (obj) {
      let ctx;

      if (obj && obj["#text"]) ctx = obj["#text"];
      else if (typeof obj === "string") ctx = obj;
      else return obj;

      if (!isNaN(ctx)) return Number(ctx);
      else if (ctx.includes("||")) return arr(ctx);
      else if (groupmatch(ctx, "true", "false")) return boolen(ctx);
      return ctx;
   };

   const convertArr = function (arr, objname = "group") {
      const result = [];
      //console.log("converting array: ", arr, objname);

      arr.forEach((item) => {
         if (isText(item)) {
            result.push(txt(item));
         } else if (Array.isArray(item)) {
            result.push(convertArr(item, objname));
         } else if (typeof item === "object") {
            result.push(convertObj(item, objname));
         } else {
            result.push(item);
         }
      });

      return result;
   };

   return convertObj(obj, "root");
};

Object.defineProperty(window, "xml2Obj", {
   value: xml2Obj,
   writable: false,
   enumerable: false,
   configurable: false,
});
