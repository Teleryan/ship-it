const dir=process.argv[2];process.argv[2]=dir;const {evalP}=require('./ctune.js');
const P=JSON.parse(process.argv[3]);for(const N of [2,3,4,5,6])console.log(N+'P',JSON.stringify(evalP(P,300,N,50000)));
