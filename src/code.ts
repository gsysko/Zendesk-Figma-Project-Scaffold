// This plugin will open a window to prompt the user to enter project details, and
// it will then create a document structure and thumbnail.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

var listFrame: FrameNode
var detailsFrame: FrameNode

// This shows the HTML page in "ui.html".
figma.showUI(__html__)
figma.ui.resize(400, 400)

if(figma.root.getPluginData("status") == "run") {
  //TODO evaluate if there is some way to reconfigure the pages after initial setup.
  figma.ui.resize(400, 136)
  figma.ui.postMessage("about")
}

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async msg => {
  switch (msg.type) {
    case "create-projct":
      await createProject(msg.projectTitle, msg.projectType, msg.projectDescription)
      figma.root.setRelaunchData({about: "This document was formated with Ztart"})
      figma.root.setPluginData("status", "run")
      break
  }
}

const PADDING_H = 40
const PADDING_V = 40
const SPACING = 24
const FONT_TITLES = { family: "Menlo", style: "Regular" }
const FONT_BODIES = { family: "SF Pro Text", style: "Regular" }

async function createProject(title, type, description) {
  // Set page names and renames the default "Page 1"
  figma.currentPage.name = "📖 About"
  switch (type) {
    case "Exploration": 
      createPage("🤔 Problem definition")
      createPage("🔬 Research")
      createPage("🏝 Explorations")
      createPage("         ↪ Solution A")
      createPage("         ↪ Solution B")
      break;
    case "Product":
      createPage("................................................................................................")
      createPage("📐 Design Specs")
      createPage("         ↪ Ready for dev")
      createPage("         ↪ Shipped")
      createPage("................................................................................................")
      createPage("🕹 Prototypes")
      createPage("         ↪ Prototype A")
      createPage("................................................................................................")
      createPage("🏝 Explorations")
      createPage("         ↪ Exploration A")
      createPage("................................................................................................")
      createPage("📦 Archives")
      createPage("         ↪ Archive A")
      break;
    case "Library":
      createPage("❓ How to...")
      createPage("         ↪ Use this library")
      createPage("         ↪ Contribute")
      createPage("................................................................................................")
      createPage("Component A")
      createPage("Component B")
      createPage("Component C")
      createPage("................................................................................................")
      createPage("🚧 Component template")
      break;
  }

  // Need to load a font here to generate the other page examples.
  await figma.loadFontAsync(FONT_TITLES)
  await figma.loadFontAsync(FONT_BODIES)

  //Add a thumnail to the first page.
  await createThumbnail(title, type).then(() => {
    // Frame for project details.
    detailsFrame = figma.createFrame()
    detailsFrame.name = "Project details"
    detailsFrame.y = 340
    detailsFrame.resizeWithoutConstraints(640, 1)
    detailsFrame.layoutMode = "VERTICAL"
    detailsFrame.counterAxisSizingMode = "FIXED"
    detailsFrame.verticalPadding = PADDING_V
    detailsFrame.horizontalPadding = PADDING_H
    detailsFrame.itemSpacing = SPACING
    figma.currentPage.appendChild(detailsFrame)

    createDetail("Description", description !== "" ? description : "<Enter a description here>")
    createDetail("External Links", "<Add links here> →\n<E.g. Confluence> →\n<E.g. Google Doc> →")
    createDetail("Slack Channels", "#<channel name here>\n#<channel name here>")
    createDetail("Points of Contact", "Design - <link Slack profile here>\nProduct - <link Slack profile here>\nEngineering - <link Slack profile here>")

    // Frame for wrapping the list of page examples.
    listFrame = figma.createFrame()
    listFrame.name = "Add other pages, as needed..."
    listFrame.y = detailsFrame.y + detailsFrame.height + SPACING
    listFrame.resizeWithoutConstraints(640, 1)
    listFrame.layoutMode = "VERTICAL"
    listFrame.counterAxisSizingMode = "FIXED"
    listFrame.verticalPadding = PADDING_V
    listFrame.horizontalPadding = PADDING_H
    listFrame.itemSpacing = 8
    figma.currentPage.appendChild(listFrame)

    // Not all projects need a prototype, shipped it/released, or research page.
    // However in order to make adding one of these pages easily, we add some
    // text to our scratch page so we can copy/paste them with the proper emoji.
    createPageExample("💅🏽 Styles")
    createPageExample("⚙️ Components")
    createPageExample("👀 Ready for Review")

    figma.closePlugin()
  })
}

// This function adds a thumbnail to your first page.
async function createThumbnail(title: string, type: string) {
  await figma.importComponentByKeyAsync("ac0b158c37de3fa8ba94d2b3801913aea262ffcb").catch(reason => {
    figma.notify("Annotation Kit library is required for thumbnails.")
    figma.closePlugin()
  }).then(async component => {
    let thumbnailFrame = figma.createFrame()
    thumbnailFrame.name = "Thumbnail - Right click to \"Set as thumbnail\""
    thumbnailFrame.resizeWithoutConstraints(640, 320)

    if (component) {
      let thumbnail = component.createInstance()
      thumbnailFrame.appendChild(thumbnail)
      figma.currentPage.appendChild(thumbnailFrame)

      let label = thumbnail.findOne(node => node.name == "File Name") as TextNode
      await figma.loadFontAsync(label.fontName as FontName).then(() => {
        if (title !== ""){
          label.characters = title
        } else {
          label.characters = "Enter title here"
        }
      })

      let badge = thumbnail.findOne(node => node.name == "Badge" && node.type == "INSTANCE") as InstanceNode
      let badgeText = badge.findOne(node => node.name == "Badge" && node.type == "TEXT") as TextNode
      await figma.loadFontAsync(badgeText.fontName as FontName).then(() => {
        badgeText.characters = type
      })
      if (type == "Exploration") {
        badge.fillStyleId = (await figma.importStyleByKeyAsync("0ee1c479d3f21d475227a4520cb481bd98af5af5")).id
      } else if (type == "Library") {
        badge.fillStyleId = (await figma.importStyleByKeyAsync("a3aa8c64d10a0b1ee92b3dc6e5f278ac978c56cf")).id
        badgeText.fillStyleId = (await figma.importStyleByKeyAsync("492c9645d67f026dd37c301c61577504bd7d8ad7")).id
      }
    }
  })
}

// Adds a new page.
function createPage(title: string) {
  let page = figma.createPage()
  page.name = title
}

// Adds a section to your details frame.
function createDetail(title: string, body: string) {
  let detailFrame = figma.createFrame()
  detailFrame.name = title
  detailFrame.layoutMode = "VERTICAL"
  detailFrame.counterAxisSizingMode = "AUTO"
  detailFrame.layoutAlign = "STRETCH"
  detailFrame.itemSpacing = 8

  let titleText = figma.createText()
  titleText.fontName = FONT_TITLES
  titleText.fontSize = 17
  titleText.characters = title
  titleText.layoutAlign = "STRETCH"
  detailFrame.appendChild(titleText)

  let bodyText = figma.createText()
  bodyText.fontName = FONT_BODIES
  bodyText.fontSize = 14
  bodyText.characters = body
  bodyText.layoutAlign = "STRETCH"
  detailFrame.appendChild(bodyText)

  detailsFrame.appendChild(detailFrame)
}

// Adds an example to your list frame.
function createPageExample(text: string) {
  let linkLabel = figma.createText()
  linkLabel.fontName = FONT_BODIES
  linkLabel.fontSize = 14
  linkLabel.characters = text
  listFrame.appendChild(linkLabel)
}