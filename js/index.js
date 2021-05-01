

history.scrollRestoration = "manual"

function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
};

var isMobile = isMobileDevice()

const contentURL = "https://cdn.contentful.com"
const deliveryKey = "wHwzaMvvOHxw4NCtIVo-Gzeh2jiaR4CpwoNp2ZE5DA4"
const contentfulSpaceId = "ecc3amn5eyba"
const contentfulEnvironment = "master"

async function getClientContent() {
    // return fetch("https://cerdman.me/projects/content/")
    return fetch(`https://cdn.contentful.com/spaces/${contentfulSpaceId}/entries`, {headers: {
        Authorization: `Bearer ${deliveryKey}` 
    }})
        .then(response => response.json())
}






function projectTemplate(project, projectPreviewURL) {


    var projectElement = document.createElement("div")
    projectElement.classList.add("project-list__item")
    projectElement.innerHTML =
        `
        <div class="project-list__item-header">
            <div class="project-list__item-title">${project.fields.title}</div>
            <div class="project-list__item-date">
                Last updated 
                ${(() => {
            var formatTimeSinceUpdate = (timeInSeconds) => {
                if (timeInSeconds >= 3600) { return `${Math.floor(timeInSeconds / 3600)} hours` }
                else if (timeInSeconds >= 60) { return `${Math.floor(timeInSeconds / 60)} minutes` }
                else { return `${Math.floor(timeInSeconds)} seconds` }
            }
            //console.log(Date.now())
            //console.log(new Date(project.sys.updatedAt).getTime())
            //console.log(Date.now() - new Date(project.sys.updatedAt).getTime())
            var secondsSinceUpdating = ((Date.now() - new Date(project.sys.updatedAt).getTime()) / 1000)
            //console.log(secondsSinceUpdating)
            return secondsSinceUpdating / 3600 > 24 ? new Date(project.sys.updatedAt).toLocaleDateString() : `${formatTimeSinceUpdate(secondsSinceUpdating)} ago`
        })()}
            </div>
        </div>
        <div class="project-list__item-body">
            <div class="project-list__item-preview"></div>
            <div class="project-list__item-description">
                <div class="project-list__item-tags">
                    ${(function () {
            var tags = ""
            project.fields.tags.forEach(function (tag) {
                //console.log(tag)
                tags += `<div class="project-list__item-tag">${tag}</div>`
            })
            return tags
        }())}
                </div>
                <div class="project-list__item-summary">${project.fields.description}</div>
                <a href="${project.fields.url}">
                    <div class="project-list__item-link">Visit</div>
                </a>
            </div>
        
    `
    // var previewElement = projectElement.querySelector(".project-list__item-preview")
    // console.log(previewElement)
    // previewElement.querySelector("iframe").onload = (e) => {
    //     console.log("iframe now contains ", e.target.contentWindow.document.children.length, " children", e.target.contentWindow.document.children)
    //     if(e.target.contentWindow.document.children.length){
    //         console.log("iframe loaded correctly")
    //         previewElement.classList.add("project-list__item-preview--loaded")
    //     }
    //     else{
    //         console.log("iframe failed to load")
    //     }
    // }


    // html2canvas(fetch("https://cerdman.me/resume/")).then((canvas) => {
    //     document.querySelector(".project-list__item-preview").appendChild(canvas)
    // })
    return projectElement
}

function findContentPreview(projectToFind, contentResponseObject) {
    return contentResponseObject.includes.Asset.find((asset) => asset.sys.id == projectToFind.fields.previewImage.sys.id)?.fields.file.url
}

(async function () {
    var contentResponse = await getClientContent()
    console.log(contentResponse)
    //console.log(contentResponse)
    contentResponse.items.forEach((project) => {
        var projectElement = projectTemplate(project)
        if (project.fields.previewImage) {
            var contentPreviewURL = findContentPreview(project, contentResponse) // go find the correct preview image from the content response, images are separated from other fields for whatever reason
            var previewElement = projectElement.querySelector(".project-list__item-preview")
            previewElement.classList.add("project-list__item-preview--loaded")
            previewElement.style.background = `url(${contentPreviewURL}) no-repeat center`
            previewElement.style.backgroundSize = `cover`


        }
        document.querySelector(".project-list").appendChild(projectElement)
    })
})()


class SectionScrollHandler {

    constructor() {

        this._staggeredScrollEvent = new Event("staggeredScroll")
        this._sections = []
        this._ticksBetweenStaggeredScroll = isMobileDevice() ? 0 : 10 // default to 5 normal ticks per staggered tick, on mobile, we don't have smooth scroll so assume scroll event only fires once
        this._ticksBeforeReset = this._ticksBetweenStaggeredScroll
        this._scrollDirection = ""
        this._lastTickScrollDelta = null
        this._previousScrollY = window.scrollY // init to whatever the windows scroll offset is
        //console.log("scroll Y", window.scrollY)
        this.scrollDirection = null
        this.calculatedOffset = window.scrollY
        var iteration = 0
        window.addEventListener("scroll", (e) => { // use this event handler for less costly actions
            // document.querySelector("body").style.background = "red"
            // if(this._previousScrollY){
            //     this.scrollingDirection = this._previousScrollY < window.scrollY ? "down" : "up"
            // }
            // // this.printOffsets()
            // this.updateSectionOffsets(window.scrollY - this._previousScrollY) // update offsets with scroll delta
            // this._lastTickScrollDelta = window.scrollY - this._previousScrollY
            // this._previousScrollY = window.scrollY
            // this.calculatedOffset += this._lastTickScrollDelta

            this.snapToNearestSection((nearestSection) => {
                //if(isMobile){return} // let the onclick handle the highlighter transform
                if (this.selectedSection && this.selectedSection == nearestSection) { // nearest section hasnt changed
                    return
                }
                else {
                    this.selectedSection = nearestSection
                }
                var data = nearestSection.getData()
                Array.from(scrollingButtons).forEach((button) => {
                    button.classList.remove("scrolling-button--selected")
                })
                data["button"].classList.add("scrolling-button--selected")
                highlighter.style.transform = `translateX(${(scrollingButtonContainer.clientWidth - 20) / 3 * data["buttonIndex"]}px)`

            })
            if (!this._ticksBeforeReset) { // fire event when ticks = 0
                window.dispatchEvent(this._staggeredScrollEvent)
                this._ticksBeforeReset = this._ticksBetweenStaggeredScroll // reset the ticks to whatever the default is, in this case 5 ticks
            }
            else {
                this._ticksBeforeReset--
            }
        })
        window.addEventListener("staggeredScroll", (e) => {
            this.setSectionOffsets()
            //window.requestAnimationFrame() // render a new frame after costly actions
        })
    }
    printOffsets() {
        var string = ""
        this._sections.forEach((section) => {
            string += section.yOffset + " "
        })
        console.log(string)
    }
    updateSectionOffsets(delta) {
        this._sections.forEach((section) => {
            section.yOffset += delta
        })
    }
    setSectionOffsets(newOffset) { // update section offsets with new delta
        this._sections.forEach((section) => {
            section.yOffset = section.getElement().getBoundingClientRect().y

        })
    }
    addSection(sectionElement) {
        var newSection = new Section(sectionElement)
        this._sections.push(newSection)
        return newSection
    }
    setScrollStragger(ticksBetweenStaggeredScroll) {
        this._ticksBetweenStaggeredScroll = ticksBetweenStaggeredScroll
    }
    snapToNearestSection(callback) { // find the nearest section and snap to it, callback should accept a Section as a param
        var nearest = this.findNearestSection()
        if (callback) { callback(nearest) }
        return nearest
    }
    findNearestSection() { // find the section who y is closest to the top of the viewport
        return this._sections.sort((sectionOne, sectionTwo) => Math.abs(sectionOne.yOffset) - Math.abs(sectionTwo.yOffset))[0] // return smallest
    }

}

function toggleBodyColor(iteration) {
    if (iteration) {
        console.log("iteration is one")
        document.querySelector("body").style.background = "red"
        iteration = 0
    }
    else {
        document.querySelector("body").style.backround = "yellow"
        iteration = 1
    }
}

class Section {
    constructor(element) {
        var { y } = element.getBoundingClientRect()
        this.label = ""
        this.yOffset = y
        this.selected
        this._element = element
        this._attachedData = {}
    }
    updateOffset(delta) {
        this.yOffset += delta
        return this.yOffset
    }
    attachData(key, content) { // takes in element, object, or other data which can then be used later through object indexing {}[index]
        this._attachedData[key] = content
        return this
    }
    getDataAtKey(key) {
        return this._attachedData[key]
    }
    getData() {
        return this._attachedData
    }
    getElement() {
        return this._element
    }
    select() {
        this._element.classList.add("section--selected")
        this.selected = true
    }
    unselect() {
        this._element.classList.remove("section--selected")
        this.selected = false
    }
}



function scrollButtonsInit() {

    var firstRefresh = true
    var buttonIndex = 0
    var scrollingButtonContainer = document.querySelector(".scrolling-button-container")
    var scrollingButtons = scrollingButtonContainer.querySelectorAll(".scrolling-button")
    var highlighter = scrollingButtonContainer.querySelector(".scrolling-button-highlight")
    var aboutSection = document.querySelector(".section--about")
    var projectsSection = document.querySelector(".section--projects")
    var contactSection = document.querySelector(".section--contact")
    var buttonArray = Array.from(scrollingButtons)

    var recentlyRefreshed = false
    var refreshTimeout = null

    var sectionScrollHandler = new SectionScrollHandler()
    var scrollingButtons = Array.from(document.querySelectorAll(".scrolling-button"))

    sectionScrollHandler.addSection(aboutSection).attachData("button", scrollingButtons[0]).attachData("buttonIndex", 0)
    sectionScrollHandler.addSection(projectsSection).attachData("button", scrollingButtons[1]).attachData("buttonIndex", 1)
    sectionScrollHandler.addSection(contactSection).attachData("button", scrollingButtons[2]).attachData("buttonIndex", 2)

    scrollingButtons[0].addEventListener(isMobile ? "touchstart" : "click", () => {
        buttonIndex = 0 // update the button index so the highlighter snaps to the correct button on refresh
        // if(isMobile){highlighter.style.transform = `translateX(${(scrollingButtonContainer.clientWidth - 20) / 3 * buttonIndex }px)`} 
        buttonArray.forEach(function (button) {
            button.classList.remove("scrolling-button--selected")
        })
        scrollingButtons[0].classList.add("scrolling-button--selected")
        console.log("about", document.querySelector(".section--about").getBoundingClientRect())
        var { x, y } = document.querySelector(".section--about").getBoundingClientRect()
        window.scrollBy({
            top: y - 80,
            left: 0,
            behavior: "smooth"
        })
    })
    scrollingButtons[1].addEventListener(isMobile ? "touchstart" : "click", () => {
        buttonIndex = 1 // update the button index so the highlighter snaps to the correct button on refresh
        // if(isMobile){highlighter.style.transform = `translateX(${(scrollingButtonContainer.clientWidth - 20) / 3 * buttonIndex }px)`} 
        buttonArray.forEach(function (button) {
            button.classList.remove("scrolling-button--selected")
        })
        scrollingButtons[1].classList.add("scrolling-button--selected")
        console.log("projects", document.querySelector(".section--projects").getBoundingClientRect())
        var { x, y } = document.querySelector(".section--projects").getBoundingClientRect()
        window.scrollBy({
            top: y - 80,
            left: 0,
            behavior: "smooth"
        })
    })
    scrollingButtons[2].addEventListener(isMobile ? "touchstart" : "click", () => {
        buttonIndex = 2 // update the button index so the highlighter snaps to the correct button on refresh
        // if(isMobile){highlighter.style.transform = `translateX(${(scrollingButtonContainer.clientWidth - 20) / 3 * buttonIndex }px)`}
        buttonArray.forEach(function (button) {
            button.classList.remove("scrolling-button--selected")
        })
        scrollingButtons[2].classList.add("scrolling-button--selected")
        console.log("contact", document.querySelector(".section--contact").getBoundingClientRect())
        var { x, y } = document.querySelector(".section--contact").getBoundingClientRect()
        window.scrollBy({
            top: y - 80,
            left: 0,
            behavior: "smooth"
        })
    })

    var resetRefreshTimeout = (doThisOnTimeout) => {
        clearTimeout(refreshTimeout)
        refreshTimeout = setTimeout(function () {
            recentlyRefreshed = false
            console.log("refreshTimeout expired!")
            doThisOnTimeout()

        }, 50)
    }

    var refresh = () => {

        recentlyRefreshed = true
        document
        if (!firstRefresh) { // we don't want to do this on first refresh because refresh gets called at the start of button init
            highlighter.classList.add("scrolling-button-highlight--resizing")
            resetRefreshTimeout(() => {
                highlighter.classList.remove("scrolling-button-highlight--resizing")
            })
        }
        firstRefresh = false
        var parentStyle = window.getComputedStyle(scrollingButtonContainer)
        var { paddingLeft, paddingRight } = parentStyle
        //console.log(paddingLeft, paddingRight, "PADDING")
        highlighter.style.transform = `translateX(${(scrollingButtonContainer.clientWidth - parseInt(paddingLeft) - parseInt(paddingRight)) / 3 * buttonIndex}px)` // move the highlighter to the correct position

    }
    var buttonArray = Array.from(scrollingButtons)

    if (!isMobileDevice()) {
        window.addEventListener("resize", () => {
            // WE NEED TO MAKE SURE WE AREN'T ON MOBILE BECAUSE THE STUPID NAVIGATION BAR WILL CAUSE A RESIZE EVENT EVERY TIME IT APPEARS, E.G. ON SAFARI WHEN YOU SCROLL UP
            refresh()
        })
    }


    refresh()

} // end of init

scrollButtonsInit()
//console.log(scrollButtonsInit)
// buttonArray.forEach(function(button, index){
//     button.addEventListener("click", function(){
//         buttonIndex = index // update the button index so the highlighter snaps to the correct button on refresh
//         buttonArray.forEach(function(button){
//             button.classList.remove("scrolling-button--selected")
//         })
//         button.classList.add("scrolling-button--selected")
//     })
// })
var scrollingButtonContainer = document.querySelector(".scrolling-button-container")
var scrollingButtons = scrollingButtonContainer.querySelectorAll(".scrolling-button")
var highlighter = scrollingButtonContainer.querySelector(".scrolling-button-highlight")
var aboutSection = document.querySelector(".section--about")
var projectsSection = document.querySelector(".section--projects")
var contactSection = document.querySelector(".section--contact")
var buttonArray = Array.from(scrollingButtons)








