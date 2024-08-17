let data;
let widgets = []; // Array to keep track of all widgets

// Fetch data from JSON file and render widgets
async function fetchData() {
  try {
    const response = await fetch("categories.json");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    data = await response.json();
    renderWidgets(data);
  } catch (error) {
    console.error(error);
  }
}

// Render dynamic widgets and menu items
function renderWidgets(data) {
  const menuContainer = document.querySelector(".widget-menu");
  const contentContainer = document.querySelector(".widget-content-container");

  // Clear existing content
  menuContainer.innerHTML = "";
  contentContainer.innerHTML = "";

  // Create buttons for CSPM, Images, and Ticket
  const categories = ["CSPM", "Images", "Ticket"];
  categories.forEach((category, index) => {
    const menuItem = document.createElement("button");
    menuItem.className = "menu-item";
    menuItem.textContent = category;
    menuItem.setAttribute("data-target", `category-${index}`);
    menuContainer.appendChild(menuItem);

    const widgetContent = document.createElement("div");
    widgetContent.className = "widget-content";
    widgetContent.id = `category-${index}`;

    // Filter data based on the category
    if (category === "CSPM") {
      data.categories.forEach((cat) => {
        cat.widgets.forEach((widget) => {
          const label = document.createElement("label");
          label.innerHTML = `<input type="checkbox" value="${widget.name}" data-category="CSPM"> ${widget.name}`;
          widgetContent.appendChild(label);
        });
      });
    } else if (category === "Images") {
      data.categories.forEach((cat) => {
        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" value="${cat.graph}" data-category="Images"> <img style="height:5rem" src="${cat.graph}" alt="${cat.name}">`;
        widgetContent.appendChild(label);
      });
    } else if (category === "Ticket") {
      data.categories.forEach((cat) => {
        cat.widgets.forEach((widget) => {
          const label = document.createElement("label");
          label.innerHTML = `<input type="checkbox" value="${widget.text}" data-category="Ticket"> ${widget.text}`;
          widgetContent.appendChild(label);
        });
      });
    }

    contentContainer.appendChild(widgetContent);
  });

  work(); // Reapply event listeners for newly created elements
  CheckBoxes(); // Reapply event listeners for newly created checkboxes
}

// Handle menu item clicks
function work() {
  const menuItems = document.querySelectorAll(".menu-item");
  const contents = document.querySelectorAll(".widget-content");

  menuItems.forEach((item) => {
    item.addEventListener("click", function () {
      contents.forEach((content) => content.classList.remove("active"));
      const targetId = this.getAttribute("data-target");
      document.getElementById(targetId).classList.add("active");
    });
  });
}

// Handle checkbox changes and update items' checked state
function CheckBoxes() {
  const checkboxes = document.querySelectorAll(`input[type='checkbox']`);
  checkboxes.forEach((check) => {
    check.addEventListener("change", function () {
      const itemValue = this.value;
      const category = this.getAttribute("data-category");

      // Find the index of the currently active widget
      const activeWidget = document.querySelector(".widget.active");
      const widgetIndex = activeWidget
        ? activeWidget.getAttribute("data-index")
        : widgets.length - 1;

      if (this.checked) {
        if (!widgets[widgetIndex].selectedItems[category].includes(itemValue)) {
          widgets[widgetIndex].selectedItems[category].push(itemValue);
        }
      } else {
        widgets[widgetIndex].selectedItems[category] = widgets[
          widgetIndex
        ].selectedItems[category].filter((item) => item !== itemValue);
      }
      updateSingleWidget(widgetIndex); // Update only the current widget with new data
    });
  });
}

// Add a new empty widget and reset checkboxes
function addWidget() {
  const widgetContainer = document.querySelector(".widget-container");

  // Create a new empty widget
  const widget = document.createElement("div");
  widget.className = "widget";
  widget.style.width = "fit-content";
  widget.style.minWidth = "35vh";
  widget.style.height = "20vh";
  widget.style.padding = "0.4rem";
  widget.innerHTML = `
    <h6>Widget <span class="remove-widget">&times;</span></h6>
    <div class="widget-content" id="img-and-data">
      <!-- This will be populated when user selects items from the sidebar -->
    </div>
  `;

  // Create a unique index for the widget and store its state
  widget.setAttribute("data-index", widgets.length);
  widget.selectedItems = {
    CSPM: [],
    Images: [],
    Ticket: [],
  };

  // Save this widget's state in the widgets array
  widgets.push(widget);

  widgetContainer.appendChild(widget);

  // Add event listener for removing the entire widget
  widget.querySelector(".remove-widget").addEventListener("click", function () {
    widget.remove(); // Remove the widget
    widgets = widgets.filter((w) => w !== widget); // Remove it from the widget array
    saveWidgetsToLocalStorage(); // Update local storage after widget removal
  });

  // Reset checkboxes
  resetSelections();

  // Reapply checkbox listeners
  CheckBoxes();
}

// Reset all checkbox selections in the sidebar
function resetSelections() {
  const checkboxes = document.querySelectorAll(`input[type='checkbox']`);
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });
}

// Function to update a single widget with the latest selected items
function updateSingleWidget(widgetIndex) {
  const widget = widgets[widgetIndex];
  widget.querySelector(".widget-content").innerHTML = renderWidgetContent(
    widget.selectedItems
  );

  // Reattach event listeners for removing individual items
  widget.querySelectorAll(".remove-item").forEach((removeIcon) => {
    removeIcon.addEventListener("click", function () {
      const category = this.getAttribute("data-category");
      const index = this.getAttribute("data-index");
      widgets[widgetIndex].selectedItems[category].splice(index, 1);
      updateSingleWidget(widgetIndex);
    });
  });
}

// Function to render content inside a widget based on selected items
function renderWidgetContent(selectedItems) {
  return Object.keys(selectedItems)
    .map((category) =>
      selectedItems[category]
        .map(
          (item, index) => `
        <div class="widget-child">
          ${
            category === "Images"
              ? `<img src="${item}" alt="widget">`
              : `<span>${item}</span>`
          }
          <span class="remove-item" data-category="${category}" data-index="${index}">&times;</span>
        </div>
      `
        )
        .join("")
    )
    .join("");
}

// Add the "Save" button to the sidebar
function addSaveButton() {
  const sidebar = document.querySelector(".overflow-container");
  const saveButton = document.createElement("button");
  saveButton.className = "save-button";
  saveButton.textContent = "Save";
  saveButton.style.backgroundColor = "yellow"; // Highlighted Save button
  sidebar.appendChild(saveButton);

  saveButton.addEventListener("click", function () {
    saveWidgetsToLocalStorage();
    clearItemDeleteIcons(); // Remove individual delete icons after saving
  });
}

// Remove individual delete icons after saving the widget
function clearItemDeleteIcons() {
  widgets.forEach((widget) => {
    widget.querySelectorAll(".remove-item").forEach((removeIcon) => {
      removeIcon.remove();
    });
  });
}

let EffectOnFocus = () => {
  const navInput = document.getElementById("nav-wala-input");
  const cover = document.querySelector(".cover-the-page");
  navInput.addEventListener("focus", () => {
    cover.style.display = "block";
  });
};
let removeFocusEfect = () => {
  const navInput = document.getElementById("nav-wala-input");
  const cover = document.querySelector(".cover-the-page");
  navInput.addEventListener("blur", () => {
    cover.style.display = "none";
  });
};
EffectOnFocus();
removeFocusEfect();
// Load widgets from local storage
function loadWidgetsFromLocalStorage() {
  const savedWidgets = JSON.parse(localStorage.getItem("savedWidgets")) || [];
  const widgetContainer = document.querySelector(".widget-container");

  savedWidgets.forEach((savedWidget) => {
    const widget = document.createElement("div");
    widget.className = "widget";
    widget.style.width = "fit-content";
    widget.style.minWidth = "35vh";
    widget.style.height = "20vh";
    widget.style.padding = "0.4rem";
    widget.innerHTML = `
      <h6>Widget <span class="remove-widget">&times;</span></h6>
      <div class="widget-content" id="img-and-data">
        ${savedWidget.content}
      </div>
    `;

    widgetContainer.appendChild(widget);
    widgets.push(widget);

    // Add event listener for removing the entire widget
    widget
      .querySelector(".remove-widget")
      .addEventListener("click", function () {
        widget.remove();
        widgets = widgets.filter((w) => w !== widget);
        saveWidgetsToLocalStorage(); // Update local storage after widget removal
      });
  });
}

// Save widgets to local storage
function saveWidgetsToLocalStorage() {
  const savedWidgets = widgets.map((widget) => ({
    content: widget.querySelector(".widget-content").innerHTML,
  }));
  localStorage.setItem("savedWidgets", JSON.stringify(savedWidgets));
}

// Show and hide sidebar
function hideSidebar() {
  document.querySelector(".overflow-container").style.display = "none";
}

function showSidebar() {
  document.querySelector(".overflow-container").style.display = "block";
}

// Initialize
document.getElementById("add-widget-btn").addEventListener("click", addWidget); // Button to add widget
fetchData();
addSaveButton();
loadWidgetsFromLocalStorage();
