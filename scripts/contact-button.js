setMadeSmall();
window.addEventListener("resize", resizeListenerContacts);

/**
 * Set the initial values for madeSmall
 */
function setMadeSmall() {
  if (window.innerWidth <= 800) {
    madeSmall = true;
  } else {
    madeSmall = false;
  }
}


/**
 * Only show the new contact button for responsive side, when the window is smaller than 800px
 */
async function buttonVisibility() {
    let button = document.getElementById("responsiveButton");
    if (window.innerWidth < 800) {
      button.classList.remove("d-none");
      await renderContacts();
    } else {
      button.classList.add("d-none");
    }
  }
  
  window.addEventListener("resize", function (event) {
    buttonVisibility();
  });

  
/**
 * Used, wenn window resize from <=800 to >800 and back
 */
function resizeListenerContacts() {
    if (window.innerWidth <= 800 && !madeSmall) {
      madeSmall = true;
      document.getElementById("contactsContainer").style.display = "none";
    }
    if (window.innerWidth > 800 && madeSmall) {
      madeSmall = false;
      if (detailDialog) {
        responsiveContactDetailsBackButton();
      } else {
        document.getElementById("contactsContainer").style.display = "block";
      }
    }
  }