window.onload = function () {
    var carousel = new Carousel(document.getElementById("Carousel"), {
        onStart: function () {
            // console.log(carousel.getIndex());
        },
        onEnd: function () {
            // console.log(carousel.getIndex());
        }
    });
    // document.getElementById("previous").onclick = function(){
    //   console.log("previous");
    //   carousel.previous()
    // }
    // document.getElementById("next").onclick = function(){
    //   console.log("next");
    //   carousel.next()
    // }
};
