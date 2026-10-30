/** Contract snapshot; quantities refer to extras beyond the included package. */
export function priceExtras(selected:number,included:number,baseCents:number,discountFrom:number|null,discountCents:number|null,allDigital=false){
 const extraCount=allDigital?0:Math.max(0,selected-included);
 const discountApplied=discountFrom!==null&&discountCents!==null&&extraCount>=discountFrom;
 const extraUnitCents=discountApplied?discountCents!:baseCents;
 return {extraCount,extraUnitCents,extraCents:extraCount*extraUnitCents,discountApplied,discountSavingsCents:extraCount*(baseCents-extraUnitCents)};
}
