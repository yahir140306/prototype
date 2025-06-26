        const carousel = document.getElementById("carousel");
        let index = 0;

        setInterval(() => {
          const children = carousel.children;
          if (children.length === 0) return;
          index = (index + 1) % children.length;
          const nextImage = children[index];
          carousel.scrollTo({
            left: nextImage.offsetLeft,
            behavior: "smooth",
          });
        }, 4000);