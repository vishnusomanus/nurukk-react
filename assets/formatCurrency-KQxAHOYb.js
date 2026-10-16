function n(r,e="INR"){return r==null||Number.isNaN(r)?"—":new Intl.NumberFormat("en-IN",{style:"currency",currency:e,maximumFractionDigits:0}).format(r)}export{n as f};
