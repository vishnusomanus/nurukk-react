function t(r){return typeof r=="object"&&r!==null&&!Array.isArray(r)}function e(r){return Array.isArray(r)?r.filter(t):t(r)&&Array.isArray(r.data)?r.data.filter(t):[]}export{e};
