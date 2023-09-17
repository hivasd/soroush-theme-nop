const HTTP_METHODS_CARTREDUX = { POST: 'POST', GET: 'GET' }

const BUTTON_METHODS = { ADD: 'ADD', UPDATE: 'UPDATE' }
class RequestHandlerCart {
  static buildHeaders(method) {
    const contentTypes = {
      [HTTP_METHODS_CARTREDUX.POST]: 'application/json',
    }
    return { 'Content-Type': contentTypes[method] }
  }

  static generateRequestOptions(method, data) {
    const headers = this.buildHeaders(method)
    const body = data ? JSON.stringify(data) : null
    return { method, headers, body }
  }

  static async requestContentFrom(url, method, data = null) {
    const options = this.generateRequestOptions(method, data)
    try {
      const response = await fetch(url, options)
      if (method === 'GET') {
        return response.json()
      } else {
        return response
      }
    } catch (error) {
      ErrorHandler.logAndThrow(error, 'Fetch Error')
    }
  }
}

/** shoppingCartReducer  */

function priceFormat(value) {
  if (value !== null) {
    let transformPrice = value.replaceAll('٬', '').replace('تومان', '')
    return transformPrice
  }
}

var store = Redux.createStore(shoppingCartReducer)
function shoppingCartReducer(state = [], action) {
  if (action.type === 'SHOPPING_CART') {
    return action.payload
  }
  return state
  // switch(action.type){
  //     case "SHOPPING_CART":
  //         return [...state, action.payload];
  //     default:
  //         return state;
  // }
}
store.subscribe(() => {
  let cartqty = document.querySelectorAll('.cart-qty')
  let qualifyPrice
  let data = []
  store.getState((data = store.getState()))

  cartqty.forEach((el) => {
    el.innerHTML = data.Count
  })

  let html
  let cartSide = document.getElementById('cartSideNav')
  let subTotal =
    this.priceFormat(data.OrderTotalResponseModel?.SubTotal) > 0
      ? this.priceFormat(data.OrderTotalResponseModel?.SubTotal)
      : 0
  // qualifyPrice = this.priceFormat(data.OrderTotalResponseModel?.SubTotal)

  if (
    data.OrderTotalResponseModel?.SubTotal === null ||
    data.OrderTotalResponseModel?.SubTotal === undefined ||
    data.OrderTotalResponseModel?.SubTotal === 0
  ) {
    html = cartHeader(0, data.Count)
  } else {
    html = cartHeader(data.OrderTotalResponseModel.SubTotal, data.Count)
  }

  html = html + `<div>`
  data.Items.forEach((element) => {
    console.log('CartStore: ', element)
    html = html + cartItemGenerator(element)
  })
  html = html + `</div>`

  if (subTotal > 199000) {
    html = html + cartFooterGeneratorMorePrice()
  } else if (subTotal > 0 && subTotal < 199000) {
    html = html + cartFooterGeneratorLessPrice()
  } else if (subTotal === 0) {
    html = html + emptyCart()
  }

  cartSide.innerHTML = html
  data.Items.forEach((element) => {
    // let cartItemquantity = document.getElementById(`quantity-${element.Id}`)
    ButtonsManagerCart.UpdateCard(
      element.ProductId,
      element.Id,
      element.Quantity,
      element.AllowedQuantities
    )
  })

  ////////////////////////////////////////////////// Show productWarning
  data.Items.forEach((element) => {
    const productWarning = document.getElementById(
      `productWarning-${element.Id}`
    )
    const removeProductBtn = document.getElementById(
      `removeProductBtn-${element.Id}`
    )
    if (element.Warnings.length !== 0) {
      removeProductBtn.style.display = 'block'
      removeProductBtn.style.margin = '10px'
      productWarning.style.display = 'block'
      productWarning.style.height = '60px'
      productWarning.innerHTML = element.Warnings
    } else {
      removeProductBtn.style.display = 'none'
      removeProductBtn.style.margin = '0'
      productWarning.style.display = 'none'
      productWarning.style.height = '0'
    }
  })
  ////////////////////////////////////////////////// Show Attribute Info
  data.Items.forEach((element) => {
    const attributeInfo = document.getElementById(`attributeInfo-${element.Id}`)
    const weightAmount = document.getElementById(`weightAmount-${element.Id}`)
    const chopWay = document.getElementById(`chopWay-${element.Id}`)
    if (element.AttributeInfo.length !== 0) {
      let result
      result = element.AttributeInfo.includes('<br />')
      if (result) {
        let fields = element.AttributeInfo.split('<br />')
        weightAmount.innerHTML = fields[0]
        chopWay.innerHTML = fields[1]
      } else {
        element.AttributeInfo
      }
    } else if (element.AttributeInfo.length === 0) {
      attributeInfo.style.display = 'none'
    }
  })
})

/** CartManager Class Inorder to Fetch API for Update Cart  */

// getShoppingCartData
let adjustmentData
class CartManagerRedux {
  static getShoppingCartData = async () => {
    let response = await RequestHandlerCart.requestContentFrom(
      '/api/ShoppingCart',
      HTTP_METHODS_CARTREDUX.GET
    )
    // adjustmentData = response.Items.find(el => el.Warnings.length === 1 ? el.Quantity = 1 : '')
    // console.log('adjustmentData',adjustmentData)
    store.dispatch({ type: 'SHOPPING_CART', payload: response })
    console.log('Redux', response)
  }
  static UpdateCardRedux = async (cartId, productId, count, method) => {
    let btnLoading = document.getElementById(`cart-counterbox-${cartId}`)
    let svgDisable = document.querySelectorAll(
      `#cart-counterbox-${cartId} button svg`
    )
    svgDisable[0].classList.add('disableSvgCartBtn')
    svgDisable[1].classList.add('disableSvgCartBtn')
    btnLoading.classList.add('loading')
    if (document.getElementById(`cart-counterbox-${cartId}`) !== null) {
      document.getElementById(`cart-counterbox-${cartId}`).disabled = true
    }
    // document.getElementById(`cart-counterbox-${productId}`).classList.add('disableAddToCartPlus')

    const counts = count
    const idCart = cartId
    let cartContents = ''
    let productCount

    if (method === 'ADD') {
      cartContents = [
        { key: `addtocart_${productId}.EnteredQuantity`, value: counts + 1 },
        { key: `itemquantity${idCart}`, value: counts + 1 },
        {
          key: `addtocart_${productId}.UpdatedShoppingCartItemId`,
          value: idCart,
        },
      ]
    } else if (method === 'UPDATE') {
      if (counts > 1) {
        cartContents = [
          { key: `addtocart_${productId}.EnteredQuantity`, value: counts - 1 },
          { key: `itemquantity${idCart}`, value: counts - 1 },
          {
            key: `addtocart_${productId}.UpdatedShoppingCartItemId`,
            value: idCart,
          },
        ]
      } else {
        cartContents = [
          { value: 0, key: 'itemquantity1' },
          { value: `${idCart}`, key: 'removefromcart' },
        ]
        try {
          document.getElementById('productCount').value = 0
          document.getElementById('count').innerHTML = 0
        } catch (error) {
          console.log('Error', error)
        }
      }
    }

    const options = RequestHandlerCart.generateRequestOptions(
      HTTP_METHODS_CARTREDUX.POST,
      cartContents
    )
    try {
      await fetch('/api/ShoppingCart/UpdateCart', options)
      const response = await fetch('/api/ShoppingCart/UpdateCart', options)
      // return response

      await CartManagerRedux.getShoppingCartData()
      btnLoading.classList.remove('loading')
      svgDisable[0].classList.remove('disableSvgCartBtn')
      svgDisable[1].classList.remove('disableSvgCartBtn')
      document
        .getElementById(`cart-counterbox-${cartId}`)
        .classList.remove('disableAddToCartPlus')
      if (document.getElementById(`cart-counterbox-${cartId}`) !== null) {
        document.getElementById(`cart-counterbox-${cartId}`).disabled = false
      }
    } catch (error) {
      // ErrorHandler.logAndThrow(error, 'Fetch Error');
    }
    // TODO: Update Redux
  }
}

CartManagerRedux.getShoppingCartData()

/** Content Generator  */
function cartHeader(totalPrice, cartCountItems) {
  return `
    <div class="sticky top-0 w-full bg-[#f7f7f7] shadow-md z-[9999]">
        <div class="flex justify-between items-center gap-[60px] pr-2 pl-4 py-2 border-b-[1px] border-solid border-[#f0f0f0]">
            <div
                class="flex items-center">
                <span class="text-[14px] text-zinc-500 p-1">سبد خرید</span>
                <BsFillCaretLeftFill size={15} class="text-zinc-400"/>
                <div class="flex items-center pr-2">
                    <div class="flex items-center text-zinc-600 pl-5">
                        <span id='cartCountItems'>${cartCountItems}</span>
                        <span class="text-[12px] font-semibold pr-2">کالا</span>
                    </div>
                </div>
            </div>
            <div
               onclick="closeCartSideNav()"
                class="flex cursor-pointer">
                <svg class="fill-iconLightColor stroke-iconLightColor stroke-3" height="20px" width="20px"
                     id="Layer_1" style="enable-background:new 0 0 512 512;" version="1.1" viewBox="0 0 512 512"
                     xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
                     xmlns:xlink="http://www.w3.org/1999/xlink">
                    <path
                        d="M437.5,386.6L306.9,256l130.6-130.6c14.1-14.1,14.1-36.8,0-50.9c-14.1-14.1-36.8-14.1-50.9,0L256,205.1L125.4,74.5  c-14.1-14.1-36.8-14.1-50.9,0c-14.1,14.1-14.1,36.8,0,50.9L205.1,256L74.5,386.6c-14.1,14.1-14.1,36.8,0,50.9  c14.1,14.1,36.8,14.1,50.9,0L256,306.9l130.6,130.6c14.1,14.1,36.8,14.1,50.9,0C451.5,423.4,451.5,400.6,437.5,386.6z"/>
                </svg>
            </div>
        </div>
    
    <div class="w-full bg-[#f7f7f7] shadow-md z-[999]">
        <div class="px-3 py-2">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <MdOutlinePriceChange class="text-xl text-zinc-500"/>
                    <span class="text-[14px] font-semibold text-zinc-400 pr-1">
                        مبلغ سفارش
                    </span>
                </div>
                <div class="text-[#12b886] text-[15px] font-semibold pl-2">
                    ${totalPrice}
                </div>
            </div>
        </div>
    </div>
    </div>`
}

function cartItemGenerator(element) {
  return `
        <div id="cartProductBox-${
          element.Id
        }" class="h-110px border-b-[1px] border-solid border-gray-cardMobileborder mt-2 mb-2">
            <div class="flex h-full pl-3 pr-1 py-2">
                <div class="flex-initial w-[30%]">
                    <a href="${window.location.origin}/${
    element.ProductSeName
  }">
                        <div class="relative w-full h-[100px]">
                            <img title="${element.Picture.Title}" alt="${
    element.Picture.AlternateText
  }" loading="lazy" sizes="100vw" src="${
    element.Picture.ImageUrl
  }" style="position: absolute; height: 100%; width: 100%; inset: 0px; color: transparent;">
                        </div>
                    </a>
                    <div class="w-full flex justify-center items-center cursor-pointer">
                       <span id="removeProductBtn-${
                         element.Id
                       }" class="remove-product-warning"
                       onclick="CartManagerRedux.UpdateCardRedux(${
                         element.Id
                       },${element.ProductId},1,BUTTON_METHODS.UPDATE);"
                       >
                       حذف</span>
                    </div>
                </div>
                <div class="flex flex-initial w-[70%] flex-col">
                    <a href="${window.location.origin}/${
    element.ProductSeName
  }">
                    <div class="text-[13px] leading-[20px] text-zinc-500 font-semibold">${
                      element.ProductName
                    }</div>
                         <div id="attributeInfo-${
                           element.Id
                         }" class="flex flex-col text-[12px] font-semibold gap-[10px] py-[10px]">
                            <div id="weightAmount-${element.Id}"> </div>
                            <div id="chopWay-${element.Id}"></div>
                         </div>
                    </a>
                    <div class="flex items-center justify-between h-full">
                        <div>
                            <div class="pt-2">
                                <span class="text-[16px] text-zinc-800 font-semibold">${element.SubTotal.replace(
                                  'تومان',
                                  ''
                                )}</span><span class="text-[10px] pr-1">تومان</span>
                            </div>
                        </div>
                <!-- ///////////////////////////////////////////// ADD TO CART BUTTON-->
                       <div id="cart-counterbox-${
                         element.Id
                       }" class="cart-counterbox action-btn flex align-center justify-between w-[110px] h-[32px] rounded-[5px] during-300 font-bold">
                                <button class="flex flex-1 p-[7px] text-red-custRed"
                                 id="plus-button-${element.Id}"
                                 onclick="CartManagerRedux.UpdateCardRedux(${
                                   element.Id
                                 },${element.ProductId},${
    element.Quantity
  },BUTTON_METHODS.ADD);">
                                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" t="1551322312294" viewBox="0 0 1024 1024" version="1.1" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                        <defs></defs><path d="M474 152m8 0l60 0q8 0 8 8l0 704q0 8-8 8l-60 0q-8 0-8-8l0-704q0-8 8-8Z"></path><path d="M168 474m8 0l672 0q8 0 8 8l0 60q0 8-8 8l-672 0q-8 0-8-8l0-60q0-8 8-8Z"></path>
                                    </svg>
                                </button>
                                <div id="quantity-${
                                  element.Id
                                }" class="product-quantity-cart flex flex-1 justify-center items-center duration-300 text-zinc-500">${
    element.Quantity
  }</div>
                                 <button class="changeState-btn flex flex-1 justify-end p-[7px] text-red-custRed"
                                 onclick="CartManagerRedux.UpdateCardRedux(${
                                   element.Id
                                 },${element.ProductId},${
    element.Quantity
  },BUTTON_METHODS.UPDATE);"
                                id="change-state-button-${element.Id}" 
                               >
<!--                                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">-->
<!--                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"></path><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"></path>-->
<!--                                    </svg>-->
                                </button>
<!--                                <button class="hidden flex flex-1 p-[7px]">-->
<!--                                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">-->
<!--                                        <path d="M872 474H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h720c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z"></path>-->
<!--                                    </svg>-->
<!--                                </button>-->
                            </div>
               <!--   /////////////////////////////////////////////////////        -->
                  </div>
                        <div id="productWarning-${
                          element.Id
                        }" class="productWarnings"></div>
              </div>
        </div>
    </div>`
}
function cartFooterGeneratorMorePrice() {
  return ` <div class="w-full mt-auto sticky bottom-0 left-0">
          <div
            class="bg-[#ffff] flex flex-col justify-between px-3 pb-[20px]
                border-t-[1px] border-solid border-gray-cardMobileborder"
          >             
            <div>
                    <a href="/order/Checkout" class="buttons complete-button">
                                    <button type="submit"> 
                                    <span class="text-[14px] font-semibold">
                                     ثبت سفارش
                                       </span>
                                    </button>
                      </a>
            </div>
          </div>
        </div>`
}
function cartFooterGeneratorLessPrice() {
  return ` <div class="w-full mt-auto sticky bottom-0 left-0">
          <div
            class="bg-[#ffff] flex flex-col justify-between px-3 pb-[20px]
                border-t-[1px] border-solid border-gray-cardMobileborder"
          >
           <div class="w-full bg-[#e0e0e0] flex justify-center items-center gap-2 p-[10px] mt-2 rounded-[10px]">
                      <div class="text-[14px] font-semibold text-[#f30235]">
                           حداقل مبلغ سفارش
                       </div>
                    <div class="text-[#f30235]">
                    <span class="text-[15px] font-semibold"> 200,000</span>
                        <span class="text-[12px]"> تومان</span>
                    </div>
                </div>
<!--            <div>-->
<!--                  <div class="flex items-center justify-between pt-2">-->
<!--                    <div class="flex items-center">-->
<!--                      <span class="text-[14px] font-semibold text-zinc-400 pr-1">-->
<!--                           حداقل مبلغ سفارش-->
<!--                       </span>-->
<!--                    </div>-->
<!--                    <div class="text-[15px] text-zinc-400 font-semibold">200,000-->
<!--                        <span> تومان</span>-->
<!--                    </div>-->
<!--                  </div> -->
<!--            </div>-->
          </div>
        </div>`
}

function emptyCart() {
  return `
  
<div class="flex w-[60%] h-[50%] m-auto">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 500 500"><defs><clipPath id="freepik--clip-path--inject-33"><path d="M183.84,408.51,173,414.77a3.24,3.24,0,0,1-2.94,0l-13.23-7.54a.89.89,0,0,1,0-1.69l10.84-6.26a3.24,3.24,0,0,1,2.94,0c3.58,2.07,9.64,5.46,13.22,7.54A.89.89,0,0,1,183.84,408.51Z" style="fill:#F30235"></path></clipPath></defs><g id="freepik--Floor--inject-33"><ellipse id="freepik--floor--inject-33" cx="249.81" cy="337.53" rx="238.19" ry="137.52" style="fill:#f5f5f5"></ellipse></g><g id="freepik--Shadows--inject-33"><path id="freepik--Shadow--inject-33" d="M421.52,361.94a1.74,1.74,0,0,0-.15-.26,2,2,0,0,0-.14-.16.9.9,0,0,0-.15-.19l-.18-.17a4.21,4.21,0,0,0-.64-.45L197.57,232.15a8,8,0,0,0-7.18,0L74.51,298.87a3.37,3.37,0,0,0-.42.27s-.11.07-.15.11a2.88,2.88,0,0,0-.6.68,1,1,0,0,0-.1.17,1.31,1.31,0,0,0-.12.28,2.25,2.25,0,0,0-.05.22,1.53,1.53,0,0,0,0,.36,2,2,0,0,0,0,.25,2.29,2.29,0,0,0,.07.28,1.69,1.69,0,0,0,.12.27A3.11,3.11,0,0,0,74.51,303l222.7,128.55a6.79,6.79,0,0,0,2.13.73,10,10,0,0,0,1.46.12,9.87,9.87,0,0,0,1.44-.11,3.55,3.55,0,0,0,.47-.09,6.76,6.76,0,0,0,1.29-.44c.14-.06.26-.14.39-.21l115.87-66.71C421.62,364.06,422,362.94,421.52,361.94Z" style="fill:#e0e0e0"></path><ellipse id="freepik--shadow--inject-33" cx="407.31" cy="298.93" rx="49.53" ry="28.6" style="fill:#e0e0e0"></ellipse><path id="freepik--shadow--inject-33" d="M146.8,447.06a11.68,11.68,0,0,1-5.76-1.43l-99.2-57.26-.09-.07a5.76,5.76,0,0,1-3-4.93,5.91,5.91,0,0,1,3.24-5l65.44-37.78a12.47,12.47,0,0,1,11.52,0L218,397.84a5.91,5.91,0,0,1,3.23,5,5.71,5.71,0,0,1-2.89,4.81,3.94,3.94,0,0,1-.4.26l-49.52,28.57-15.88,9.17a11.68,11.68,0,0,1-5.76,1.42Z" style="fill:#e0e0e0"></path></g><g id="freepik--Device--inject-33"><g id="freepik--device--inject-33"><g id="freepik--Mobile--inject-33"><path d="M411.86,347.2a1.22,1.22,0,0,0-.16-.26,1.83,1.83,0,0,0-.13-.16.9.9,0,0,0-.16-.19l-.17-.16a3.73,3.73,0,0,0-.65-.46L194,220.9a8,8,0,0,0-7.18,0L80.58,282.21l-.43.27-.14.12a2.64,2.64,0,0,0-.6.67,1.47,1.47,0,0,0-.22.46,1.42,1.42,0,0,0,0,.22,1.47,1.47,0,0,0,0,.36,2.11,2.11,0,0,0,0,.25,2.86,2.86,0,0,0,.07.28,2.18,2.18,0,0,0,.11.27,3.13,3.13,0,0,0,1.28,1.24L297.21,411.43a6.53,6.53,0,0,0,2.13.72,8.81,8.81,0,0,0,1.46.13,8.66,8.66,0,0,0,1.44-.12,3.55,3.55,0,0,0,.47-.09,6.13,6.13,0,0,0,1.29-.44c.14-.06.26-.13.39-.2l106.2-61.32C412,349.32,412.38,348.2,411.86,347.2Zm-23.33-4.44-6.79,3.93-90.49,52.2a5.49,5.49,0,0,1-.73.36,6.07,6.07,0,0,1-4.66,0,5.49,5.49,0,0,1-.73-.36L113.32,299.7,105,294.91a3.18,3.18,0,0,1-.78-.62c-.86-.94-.59-2.14.78-2.94l97.24-56.14a6.12,6.12,0,0,1,3.77-1.05,3.47,3.47,0,0,1,.93.25,3,3,0,0,1,.48.23L388.53,339.2A2.06,2.06,0,0,1,388.53,342.76Z" style="fill:#455a64"></path><path d="M80.16,282.49A8.05,8.05,0,0,0,77,288.44v4.74a7.93,7.93,0,0,0,3.59,6.23L297.18,424.47a6.81,6.81,0,0,0,2.64.81c.32,0,.63.05,1,.06h0V412.28h0a11.65,11.65,0,0,1-1.46-.12,6.61,6.61,0,0,1-2.14-.74L80.58,286.35C78.75,285.3,78.6,283.63,80.16,282.49Z" style="fill:#37474f"></path><path d="M354.49,372.67a14.45,14.45,0,0,0-12.82,0,5.17,5.17,0,0,0-1.92,1.75c-1.15,2,1,3.5,1.92,4.06a14.45,14.45,0,0,0,12.82,0,5.42,5.42,0,0,0,1.92-1.75C357.56,374.73,355.44,373.23,354.49,372.67Z" style="fill:#F30235"></path><path d="M142.37,257.18a1.07,1.07,0,0,0,0-2,3.88,3.88,0,0,0-3.51,0,1.07,1.07,0,0,0,0,2A3.88,3.88,0,0,0,142.37,257.18Z" style="fill:#263238"></path><path d="M136.86,266.78a1,1,0,0,0,0-1.8,3.49,3.49,0,0,0-3.12,0,1,1,0,0,0,0,1.8A3.43,3.43,0,0,0,136.86,266.78Z" style="fill:#263238"></path><path d="M142.13,263.81l17.44-10.07c1-.55,1-1.42.1-1.94a3.7,3.7,0,0,0-3.35.07l-17.44,10.06c-.95.56-1,1.42-.1,1.94A3.7,3.7,0,0,0,142.13,263.81Z" style="fill:#263238"></path><path d="M411.07,346.29c1.48,1.15,1.32,2.78-.48,3.82L304.38,411.43a7.22,7.22,0,0,1-3.59.85v13.05a7.29,7.29,0,0,0,3.58-.86l106.21-61.31a7.91,7.91,0,0,0,3.59-6.22l0-4.75A8.05,8.05,0,0,0,411.07,346.29Z" style="fill:#263238"></path><path d="M131.24,319.27a4,4,0,0,1,1.86,3.08,1.14,1.14,0,0,1-.52,1.08c-.22.13-1.06.63-1.3.76a1.37,1.37,0,0,1-1.34-.15l-24.15-14a4,4,0,0,1-1.85-3.08,1.2,1.2,0,0,1,.47-1.06l1.34-.78a1.37,1.37,0,0,1,1.34.15Z" style="fill:#455a64"></path><path d="M129.94,320l-24.15-13.94c-1-.59-1.85-.17-1.85.94a4,4,0,0,0,1.85,3.08l24.15,14c1,.59,1.86.17,1.86-.94A4,4,0,0,0,129.94,320Z" style="fill:#263238"></path><path d="M98.91,300.6a4,4,0,0,1,1.86,3.09,1.17,1.17,0,0,1-.51,1.08c-.23.12-1.07.63-1.3.76a1.37,1.37,0,0,1-1.34-.16L86.23,298.8a4,4,0,0,1-1.85-3.08,1.15,1.15,0,0,1,.47-1.06c.22-.15,1.1-.65,1.34-.78a1.34,1.34,0,0,1,1.34.15Z" style="fill:#455a64"></path><path d="M97.62,301.35l-11.39-6.57c-1-.59-1.85-.17-1.85.94a4,4,0,0,0,1.85,3.08l11.39,6.57c1,.59,1.85.17,1.85-.94A4,4,0,0,0,97.62,301.35Z" style="fill:#263238"></path></g><g id="freepik--Window--inject-33"><path d="M388.53,342.71l-6.79,3.92-90.49,52.21a7.05,7.05,0,0,1-.73.36,6.07,6.07,0,0,1-4.66,0,7.05,7.05,0,0,1-.73-.36L113.32,299.65l-8.31-4.8a2.94,2.94,0,0,1-.78-.61c-.86-.94-.59-2.15.78-2.95l97.24-56.13a6.12,6.12,0,0,1,3.77-1,3.47,3.47,0,0,1,.93.25,3,3,0,0,1,.48.23l181.1,104.56A2.06,2.06,0,0,1,388.53,342.71Z" style="fill:#F30235"></path><path d="M388.53,342.71l-6.79,3.92-90.49,52.21a7.05,7.05,0,0,1-.73.36,6.07,6.07,0,0,1-4.66,0,7.05,7.05,0,0,1-.73-.36L113.32,299.65l-8.31-4.8a2.94,2.94,0,0,1-.78-.61c-.86-.94-.59-2.15.78-2.95l97.24-56.13a6.12,6.12,0,0,1,3.77-1,3.47,3.47,0,0,1,.93.25,3,3,0,0,1,.48.23l181.1,104.56A2.06,2.06,0,0,1,388.53,342.71Z" style="fill:#fff;opacity:0.8"></path><path d="M125.54,287.51a.48.48,0,0,1-.14-.05l-.47-.28-1.15.67a.18.18,0,0,1-.2,0l-.17-.09-.08-.06a.43.43,0,0,1,0-.07l-.48-1.69a.23.23,0,0,1,0-.07.17.17,0,0,1,.06-.06l.16-.09a.28.28,0,0,1,.15,0,.37.37,0,0,1,.15.05l1.66,1,.26-.14a.18.18,0,0,1,.13,0,.3.3,0,0,1,.15.05l.11.06c.05,0,.08.06.08.08s0,.05-.07.08l-.25.15.48.27a.19.19,0,0,1,.08.08s0,.05-.08.08l-.19.12A.37.37,0,0,1,125.54,287.51Zm-1-.6-1.18-.69.35,1.17Z" style="fill:#455a64"></path><path d="M126.62,286.55a3.2,3.2,0,0,1-1.44-.44c-.47-.28-.73-.55-.76-.83s.16-.54.56-.78a3.43,3.43,0,0,1,.52-.23,2.78,2.78,0,0,1,.53-.11s.06,0,.08,0,0,0,0,0l.1.19s0,0,0,0l-.07,0a1.94,1.94,0,0,0-.75.24c-.27.16-.4.34-.38.54s.22.39.59.6a2.33,2.33,0,0,0,1,.35,1.65,1.65,0,0,0,.89-.21l.26-.18a.73.73,0,0,0,.15-.17l-.78-.45-.48.27a.19.19,0,0,1-.14,0,.3.3,0,0,1-.14-.05l-.11-.06s-.08-.06-.08-.08,0-.05.07-.08l.76-.44a.34.34,0,0,1,.16,0,.29.29,0,0,1,.17.06l1.11.64a.18.18,0,0,1,.08.06s0,0,0,.06a1.29,1.29,0,0,1-.66.66A2.41,2.41,0,0,1,126.62,286.55Z" style="fill:#455a64"></path><path d="M136.13,280.85c.37.22.37.56,0,.77a1.42,1.42,0,0,1-1.33,0c-.37-.21-.37-.55,0-.77A1.48,1.48,0,0,1,136.13,280.85Z" style="fill:#455a64"></path><path d="M133.71,280.22c-.67.39-.88.95-.62,1.44a.43.43,0,0,0,.4.15h0c.22,0,.38-.15.31-.27-.19-.35,0-.74.43-1a2.65,2.65,0,0,1,1.75-.25c.22,0,.44,0,.47-.18h0c0-.11-.09-.2-.26-.24A4,4,0,0,0,133.71,280.22Z" style="fill:#455a64"></path><path d="M132.64,279.61c-1,.57-1.36,1.38-1.07,2.13,0,.11.21.18.4.17h0c.22,0,.36-.14.31-.26-.23-.61.06-1.27.87-1.74a5.08,5.08,0,0,1,3-.51c.22,0,.43,0,.45-.18h0c0-.11-.11-.21-.3-.23A6.08,6.08,0,0,0,132.64,279.61Z" style="fill:#455a64"></path><path d="M152.31,270.09a.21.21,0,0,1-.11,0s0,0,0-.07l.2-1s0-.05,0-.07l.06-.06.35-.2a.2.2,0,0,1,.11,0,.21.21,0,0,1,.12,0l2.86,1.65a.06.06,0,0,1,0,.06.07.07,0,0,1,0,.07l-.36.21a.24.24,0,0,1-.12,0,.21.21,0,0,1-.12,0l-2.18-1.26L153,270s0,0-.06.06a.27.27,0,0,1-.13,0Z" style="fill:#455a64"></path><path d="M154.55,268.8a.21.21,0,0,1-.12,0,.09.09,0,0,1,0-.07l.21-1a.19.19,0,0,1,0-.07l.05-.06.35-.2a.21.21,0,0,1,.12,0,.24.24,0,0,1,.12,0l2.85,1.65s0,0,0,.07a.07.07,0,0,1,0,.06l-.36.21a.21.21,0,0,1-.12,0l-.12,0-2.18-1.26-.13.65a.14.14,0,0,1-.07.06.22.22,0,0,1-.12,0Z" style="fill:#455a64"></path><path d="M157.35,267a.27.27,0,0,1,.12,0,.21.21,0,0,1,.12,0l.44.25a.06.06,0,0,1,0,.06.08.08,0,0,1,0,.07l-.41.24-.12,0a.21.21,0,0,1-.12,0l-.44-.25a.08.08,0,0,1,0-.07.09.09,0,0,1,0-.07Zm1.55.89a.26.26,0,0,1,.24,0l.43.25s.05,0,.05.07a.1.1,0,0,1-.05.07l-.41.23a.25.25,0,0,1-.24,0l-.43-.25s-.05,0-.05-.07a.07.07,0,0,1,.05-.06Z" style="fill:#455a64"></path><path d="M161.93,267a.26.26,0,0,1-.24,0l-.53-.3-1.37.79-.12,0a.22.22,0,0,1-.12,0l-.31-.18c-.05,0-.07-.05-.08-.08a.17.17,0,0,1,0-.1l-.34-1.75a.15.15,0,0,1,.07-.17l.34-.2.12,0,.11,0,1.77,1,.38-.22.12,0,.12,0,.31.19a.07.07,0,0,1,.05.06s0,.05-.05.07l-.38.22.54.31s.05,0,0,.07a.08.08,0,0,1,0,.07Zm-1.33-.62-.94-.55.19,1Z" style="fill:#455a64"></path><path d="M160.73,264.22a.1.1,0,0,1,0-.07s0,0,0-.07l1.66-1a.25.25,0,0,1,.24,0l.31.18s.05,0,.05.07,0,.05-.05.07l-1.24.71.52.36a.73.73,0,0,1,.18-.17l.18-.12a2.47,2.47,0,0,1,.53-.22,2.13,2.13,0,0,1,.56-.1,2.09,2.09,0,0,1,.56,0,2,2,0,0,1,.53.2,1,1,0,0,1,.39.34.45.45,0,0,1,.08.33.53.53,0,0,1-.17.32,2.19,2.19,0,0,1-.4.3,3.33,3.33,0,0,1-.59.26,2.91,2.91,0,0,1-.55.1,2.67,2.67,0,0,1-.5,0,1.65,1.65,0,0,1-.41-.14s-.05,0-.05-.07,0-.05.05-.07l.36-.21.11,0,.12,0a1.23,1.23,0,0,0,.25.05l.24,0,.22-.07.2-.1c.17-.1.26-.2.27-.32s-.06-.21-.22-.3a.81.81,0,0,0-.48-.1,1.16,1.16,0,0,0-.55.15,1.46,1.46,0,0,0-.19.13.58.58,0,0,0-.08.1.2.2,0,0,1,0,.08.19.19,0,0,1-.08.07l-.41.24-.12,0-.11,0Z" style="fill:#455a64"></path><polygon points="113.2 295.04 112.28 294.51 113.5 293.8 114.42 294.33 113.2 295.04" style="fill:#455a64"></polygon><polygon points="115.04 293.98 113.2 292.92 114.42 292.21 116.26 293.27 115.04 293.98" style="fill:#455a64"></polygon><polygon points="116.88 292.92 114.12 291.32 115.34 290.62 118.11 292.21 116.88 292.92" style="fill:#455a64"></polygon><polygon points="118.72 291.86 115.04 289.73 116.27 289.02 119.94 291.15 118.72 291.86" style="fill:#455a64"></polygon><path d="M201.9,240.38a1.37,1.37,0,0,0-.72.11l-4.59,2.64c-.3.17-.22.49.17.72l1.68,1a2,2,0,0,0,.81.24,1.43,1.43,0,0,0,.36,0,1,1,0,0,0,.36-.1l4.59-2.64c.29-.18.22-.49-.18-.72l-1.67-1A2,2,0,0,0,201.9,240.38Zm-2.7,4.5a.78.78,0,0,1-.34-.12l-1.68-1c-.29-.17-.35-.42-.13-.55l4.59-2.64a.53.53,0,0,1,.19-.06h.11a.81.81,0,0,1,.35.12l1.67,1c.29.17.35.42.14.54l-4.59,2.65A.64.64,0,0,1,199.2,244.88Z" style="fill:#455a64"></path><path d="M198.21,242.92l2,1.14-.72.42a.44.44,0,0,1-.25,0l-1.47-.85c-.21-.12-.26-.31-.1-.41Z" style="fill:#455a64"></path><polygon points="198.55 242.73 199.41 242.23 201.39 243.37 200.52 243.87 198.55 242.73" style="fill:#455a64"></polygon><polygon points="199.75 242.04 200.6 241.54 202.59 242.69 201.73 243.19 199.75 242.04" style="fill:#455a64"></polygon><path d="M201.93,240.93l1.43.83c.26.15.21.37-.15.57l-.29.17-2-1.15.69-.39A.41.41,0,0,1,201.93,240.93Z" style="fill:#455a64"></path><path d="M202.89,240.52a1.23,1.23,0,0,1,.85.23l.31.18c.34.2.53.42.4.5l-.21.14-1.58-.91Z" style="fill:#455a64"></path><polygon points="190.21 248.1 193.77 245.01 195.65 247.68 193.19 247.01 190.21 248.1" style="fill:#455a64"></polygon></g><g id="freepik--Button--inject-33"><path d="M266,378.05v.88a4.82,4.82,0,0,0,2.19,3.79l17.16,9.9a4.83,4.83,0,0,0,4.38,0l84.57-48.85a4.85,4.85,0,0,0,2.19-3.8v-.87a4.85,4.85,0,0,0-2.19-3.8l-17.16-9.9a4.83,4.83,0,0,0-4.38,0l-84.57,48.86A4.85,4.85,0,0,0,266,378.05Z" style="fill:#F30235"></path><path d="M374.55,335.5c.91.69.81,1.7-.29,2.33l-84.57,48.86a4.61,4.61,0,0,1-2.19.53v5.92a4.44,4.44,0,0,0,2.2-.52l84.56-48.85a4.88,4.88,0,0,0,2.19-3.8v-.87A4.87,4.87,0,0,0,374.55,335.5Z" style="opacity:0.15"></path><path d="M267.82,374.49a4.9,4.9,0,0,0-1.86,3.56v.88a4.81,4.81,0,0,0,2.2,3.79l17.15,9.9a4.38,4.38,0,0,0,2.19.52v-5.92a4.58,4.58,0,0,1-2.19-.53l-17.16-9.9C267.06,376.17,267,375.19,267.82,374.49Z" style="opacity:0.30000000000000004"></path><path d="M293.21,368.25a.88.88,0,0,1,.44-.12,2.06,2.06,0,0,1,.39.05l9,2.52.2.07a.16.16,0,0,1,.09.14s0,.09-.09.13l-1.34.77a.79.79,0,0,1-.39.12.8.8,0,0,1-.29,0l-1.18-.34-2.82,1.63.59.68a.24.24,0,0,1,.06.17c0,.07-.07.14-.21.22l-1.34.77a.41.41,0,0,1-.23.06.45.45,0,0,1-.24-.06.28.28,0,0,1-.11-.11l-4.38-5.2a.39.39,0,0,1-.08-.22c0-.09.07-.17.21-.25Zm2.92,3.67,1.72-1-3.41-1Z" style="fill:#455a64"></path><path d="M300,364.33a6.68,6.68,0,0,1,1.56-.65,7.85,7.85,0,0,1,1.65-.25,6.31,6.31,0,0,1,1.63.15,6,6,0,0,1,1.48.52l.41.23.36.21.35.2.38.23a3,3,0,0,1,.93.86,1.52,1.52,0,0,1,.26.92,1.79,1.79,0,0,1-.42.95,3.89,3.89,0,0,1-1.11.89l-2.86,1.65a.52.52,0,0,1-.29.07.49.49,0,0,1-.28-.07l-6.86-3.95c-.08-.05-.12-.1-.12-.17a.18.18,0,0,1,.12-.16Zm4.31.88a2.63,2.63,0,0,0-2.66.13l-1.08.63,4,2.33,1.13-.66c.89-.51.95-1,.17-1.51l-.41-.25-.38-.22-.37-.21Z" style="fill:#455a64"></path><path d="M307.67,359.9a6.68,6.68,0,0,1,1.56-.65,7.84,7.84,0,0,1,1.66-.25,6.74,6.74,0,0,1,1.62.15,5.76,5.76,0,0,1,1.48.52l.42.23.35.21.35.2.39.23a3.08,3.08,0,0,1,.92.86,1.46,1.46,0,0,1,.26.92,1.69,1.69,0,0,1-.41.95,4,4,0,0,1-1.11.89l-2.87,1.65a.51.51,0,0,1-.28.07.52.52,0,0,1-.29-.07l-6.86-3.95a.22.22,0,0,1-.12-.17.19.19,0,0,1,.12-.16Zm4.31.88a2.63,2.63,0,0,0-2.66.13l-1.08.63,4,2.33,1.14-.66c.89-.51.94-1,.17-1.51l-.41-.25c-.13-.07-.26-.14-.38-.22l-.38-.21Z" style="fill:#455a64"></path><path d="M319.7,353a.51.51,0,0,1,.28-.07.52.52,0,0,1,.29.07l1.13.65a.18.18,0,0,1,.11.16.19.19,0,0,1-.11.17L319.53,355l5.44,3.14c.08,0,.12.1.12.17a.19.19,0,0,1-.12.16l-1.39.8a.49.49,0,0,1-.28.07.52.52,0,0,1-.29-.07l-5.44-3.14-1.87,1.08a.65.65,0,0,1-.29.07.58.58,0,0,1-.28-.07l-1.13-.65c-.08-.05-.12-.1-.12-.17a.19.19,0,0,1,.12-.16Z" style="fill:#455a64"></path><path d="M323.34,354.06a3,3,0,0,1-.86-.8,1.4,1.4,0,0,1-.27-.9,1.83,1.83,0,0,1,.41-.95,4.28,4.28,0,0,1,1.15-.93,6.75,6.75,0,0,1,1.61-.66,7.3,7.3,0,0,1,1.64-.24,6.17,6.17,0,0,1,1.56.16,5.77,5.77,0,0,1,1.38.49l1,.54.91.55a3,3,0,0,1,.86.8,1.4,1.4,0,0,1,.27.9,1.65,1.65,0,0,1-.41,1,3.89,3.89,0,0,1-1.15.92,6.59,6.59,0,0,1-1.61.68,7.2,7.2,0,0,1-1.64.23,6.17,6.17,0,0,1-1.56-.16,5.93,5.93,0,0,1-1.38-.49c-.31-.16-.62-.34-1-.53Zm6.49-1.63-.4-.26-.46-.28-.49-.27-.43-.22a2.54,2.54,0,0,0-.6-.22,2.74,2.74,0,0,0-.64-.08,2.63,2.63,0,0,0-.67.09,2.94,2.94,0,0,0-.67.27,1.49,1.49,0,0,0-.47.39.64.64,0,0,0-.15.39.62.62,0,0,0,.13.37,1.43,1.43,0,0,0,.38.34,3.59,3.59,0,0,0,.38.25c.15.09.3.19.47.28l.48.27a4.83,4.83,0,0,0,.45.23,2.91,2.91,0,0,0,1.25.3,2.46,2.46,0,0,0,1.33-.37c.44-.25.64-.5.62-.76A1,1,0,0,0,329.83,352.43Z" style="fill:#455a64"></path><path d="M335.21,347.26l.37.23.5.29.51.3.41.21a2.49,2.49,0,0,0,.56.21,2.59,2.59,0,0,0,.63.1,3.14,3.14,0,0,0,.67-.08,2.48,2.48,0,0,0,.71-.29,1.73,1.73,0,0,0,.5-.39.87.87,0,0,0,.18-.34.47.47,0,0,0,0-.29,1,1,0,0,0-.16-.23.59.59,0,0,1-.12-.21s.06-.11.18-.18l1.39-.8a.55.55,0,0,1,.46,0,1.93,1.93,0,0,1,.76.74,1.29,1.29,0,0,1,.13.88,2.21,2.21,0,0,1-.49.93,4.06,4.06,0,0,1-1.1.87,6.42,6.42,0,0,1-1.59.65,6.7,6.7,0,0,1-1.64.24,6.2,6.2,0,0,1-1.57-.16,5.16,5.16,0,0,1-1.37-.49c-.31-.15-.62-.33-1-.52s-.64-.38-.93-.57a2.74,2.74,0,0,1-.86-.78,1.5,1.5,0,0,1-.26-.91,1.73,1.73,0,0,1,.4-.95,3.83,3.83,0,0,1,1.14-.92,6.51,6.51,0,0,1,1.51-.63,8.3,8.3,0,0,1,1.6-.29,6.44,6.44,0,0,1,1.53.08,3.94,3.94,0,0,1,1.28.43.17.17,0,0,1,.1.14.14.14,0,0,1-.1.13l-1.39.81a.62.62,0,0,1-.31.1,2.36,2.36,0,0,1-.35-.07,2.15,2.15,0,0,0-.4-.09,2,2,0,0,0-.5,0,3.47,3.47,0,0,0-.59.1,3,3,0,0,0-.68.3,1.46,1.46,0,0,0-.5.41.62.62,0,0,0-.14.38.64.64,0,0,0,.16.37A2.37,2.37,0,0,0,335.21,347.26Z" style="fill:#455a64"></path><path d="M341.93,340.12a.88.88,0,0,1,.44-.12,2.06,2.06,0,0,1,.39.05l9,2.52.2.07c.07,0,.1.08.1.14s0,.09-.1.13l-1.33.77a.86.86,0,0,1-.4.12,1,1,0,0,1-.28,0l-1.18-.34-2.83,1.63.59.68a.24.24,0,0,1,.06.17c0,.07-.07.14-.21.22l-1.34.78a.55.55,0,0,1-.46,0,.34.34,0,0,1-.12-.12l-4.37-5.2a.33.33,0,0,1-.08-.22c0-.09.06-.17.2-.26Zm2.92,3.67,1.72-1-3.41-1Z" style="fill:#455a64"></path><path d="M348.79,336.16a7.85,7.85,0,0,1,1.4-.63,5.87,5.87,0,0,1,1.38-.29,4.78,4.78,0,0,1,1.36.1,4.48,4.48,0,0,1,1.28.5,2.16,2.16,0,0,1,1,1,1,1,0,0,1-.13,1l3.84.7a.37.37,0,0,1,.15.05c.07,0,.1.08.1.14s0,.09-.1.13l-1.44.83a.66.66,0,0,1-.4.12l-.33,0-3.45-.63-1,.56,2.27,1.31c.08,0,.12.1.12.17a.19.19,0,0,1-.12.16l-1.39.8a.51.51,0,0,1-.28.07.52.52,0,0,1-.29-.07l-6.86-3.95a.19.19,0,0,1-.11-.17.2.2,0,0,1,.11-.17Zm2,2.55L352,338a1.33,1.33,0,0,0,.57-.52c.08-.18,0-.36-.32-.53a1.36,1.36,0,0,0-.91-.18,2.48,2.48,0,0,0-.91.32l-1.2.7Z" style="fill:#455a64"></path><path d="M358.39,330.62a.64.64,0,0,1,.58,0l1.12.65a.19.19,0,0,1,.12.16c0,.07,0,.12-.12.17l-1.87,1.08,5.45,3.14a.19.19,0,0,1,.11.17.18.18,0,0,1-.11.16l-1.39.81a.73.73,0,0,1-.58,0l-5.44-3.15-1.87,1.08a.61.61,0,0,1-.28.07.62.62,0,0,1-.29-.07l-1.13-.65a.21.21,0,0,1-.11-.17.19.19,0,0,1,.11-.16Z" style="fill:#455a64"></path><path d="M280,374c-2.69,1.55-2.69,4.06,0,5.6a10.72,10.72,0,0,0,9.71,0c2.68-1.54,2.68-4.05,0-5.6A10.72,10.72,0,0,0,280,374Zm8,1.83-1.8,1,1.8,1a.36.36,0,0,1,0,.69,1.31,1.31,0,0,1-1.19,0l-1.81-1-1.8,1a1.31,1.31,0,0,1-1.19,0,.36.36,0,0,1,0-.69l1.8-1-1.8-1a.36.36,0,0,1,0-.69,1.31,1.31,0,0,1,1.19,0l1.8,1,1.81-1a1.31,1.31,0,0,1,1.19,0A.36.36,0,0,1,287.92,375.86Z" style="fill:#455a64"></path></g></g></g><g id="freepik--Cart--inject-33"><g id="freepik--cart--inject-33"><path d="M298.2,308.63a14.86,14.86,0,0,0-6.66-11.7c-1.94-1.14-3.69-1.19-4.93-.38h0l-4.55,2.56,9.55,16.47,4.51-2.56h0C297.38,312.33,298.18,310.82,298.2,308.63Z" style="fill:#37474f"></path><path d="M286.81,299.61a14.91,14.91,0,0,1,6.66,11.7c0,4.3-3.06,6-6.76,3.85a14.91,14.91,0,0,1-6.66-11.7C280.08,299.16,283.11,297.44,286.81,299.61Z" style="fill:#455a64"></path><path d="M284.49,306.06c0-1.68,1-2.45,2.29-1.71a5.43,5.43,0,0,1,2.25,4.37c0,1.68-1,2.44-2.29,1.71A5.48,5.48,0,0,1,284.49,306.06Z" style="fill:#263238"></path><path d="M293.47,311.31a12.35,12.35,0,0,0-.92-4.5L281,300.1a5.78,5.78,0,0,0-.94,3.36c0,.05,0,.1,0,.16l13.4,7.78S293.47,311.34,293.47,311.31Z" style="opacity:0.15"></path><path d="M250.32,345.22a14.41,14.41,0,0,1-7.12-1.28l-63-36.31c-3.81-1.92-8.09-6.9-8.36-11.62l-1.93-44.91,3.51-.2,1.94,44.92c.18,3.2,3.53,7.22,6.41,8.66l63.05,36.32a12.11,12.11,0,0,0,10.58-.61l42-24.22c1-.66,1.59-1.45,1.55-2.12s-.67-1.33-1.74-1.87L229.72,272.8c-3.8-1.91-8.06-6.9-8.33-11.62l-.94-24.91,3.51-.19.94,24.9c.18,3.22,3.53,7.23,6.4,8.67l67.49,39.19c2.25,1.13,3.55,2.84,3.67,4.81s-1,3.88-3.13,5.26l-42,24.22A14.57,14.57,0,0,1,250.32,345.22Z" style="fill:#455a64"></path><path d="M239,344.21a14.86,14.86,0,0,0-6.66-11.7c-1.94-1.14-3.69-1.2-4.92-.38h0l-4.56,2.56,9.55,16.47,4.51-2.56v0C238.16,347.91,239,346.4,239,344.21Z" style="fill:#37474f"></path><path d="M227.59,335.19a14.86,14.86,0,0,1,6.66,11.71c0,4.29-3.05,6-6.76,3.84a14.88,14.88,0,0,1-6.65-11.7C220.87,334.75,223.89,333,227.59,335.19Z" style="fill:#455a64"></path><path d="M225.27,341.64c0-1.68,1-2.45,2.29-1.71a5.41,5.41,0,0,1,2.25,4.37c0,1.67-1,2.44-2.28,1.7A5.44,5.44,0,0,1,225.27,341.64Z" style="fill:#263238"></path><path d="M192.42,317.36a14.86,14.86,0,0,0-6.63-11.71c-1.95-1.14-3.69-1.2-4.93-.39h0l-4.56,2.55,9.52,16.49,4.52-2.56h0C191.6,321.06,192.4,319.55,192.42,317.36Z" style="fill:#37474f"></path><path d="M181.05,308.33A14.88,14.88,0,0,1,187.69,320c0,4.29-3.07,6-6.77,3.83a14.86,14.86,0,0,1-6.63-11.71C174.32,307.86,177.35,306.15,181.05,308.33Z" style="fill:#455a64"></path><path d="M178.72,314.76c0-1.67,1-2.44,2.29-1.7a5.45,5.45,0,0,1,2.25,4.37c0,1.68-1,2.44-2.3,1.71A5.49,5.49,0,0,1,178.72,314.76Z" style="fill:#263238"></path><path d="M162.38,196.68a11.71,11.71,0,0,1,4.49-12.46l41.91-23.69c3.81-2.5,8-.76,9.32,3.59l2.91,9.43-2.88,1.68L215,165.7a3.17,3.17,0,0,0-5-1.75L169.19,187a7.69,7.69,0,0,0-2.93,8l2.46,9.05-3.43,2Z" style="fill:#455a64"></path><polygon points="227.18 242.12 170.88 274.63 253.16 322.13 309.46 289.62 227.18 242.12" style="fill:#F30235"></polygon><polygon points="227.18 242.12 170.88 274.63 253.16 322.13 309.46 289.62 227.18 242.12" style="opacity:0.5"></polygon><polygon points="165.29 206.11 221.01 173.56 227.18 242.12 170.88 274.63 165.29 206.11" style="fill:#F30235"></polygon><polygon points="165.29 206.11 221.01 173.56 227.18 242.12 170.88 274.63 165.29 206.11" style="opacity:0.35000000000000003"></polygon><path d="M221,173.56l6.17,68.56,82.28,47.5,13-57.51Zm28.77,65.92a4.73,4.73,0,0,1-5.9-3.06l-13.6-35.29A4.44,4.44,0,1,1,238.5,198l13.6,35.29A4.72,4.72,0,0,1,249.78,239.48Zm25.69,12.08a4.71,4.71,0,0,1-5.9-3.05L256,213.22a4.44,4.44,0,1,1,8.22-3.17l13.6,35.29A4.71,4.71,0,0,1,275.47,251.56Zm25.69,12.09a4.71,4.71,0,0,1-5.9-3l-13.59-35.29a4.43,4.43,0,1,1,8.21-3.17l13.6,35.29A4.71,4.71,0,0,1,301.16,263.65Z" style="fill:#F30235"></path><path d="M221,173.56l6.17,68.56,82.28,47.5,13-57.51Zm28.77,65.92a4.73,4.73,0,0,1-5.9-3.06l-13.6-35.29A4.44,4.44,0,1,1,238.5,198l13.6,35.29A4.72,4.72,0,0,1,249.78,239.48Zm25.69,12.08a4.71,4.71,0,0,1-5.9-3.05L256,213.22a4.44,4.44,0,1,1,8.22-3.17l13.6,35.29A4.71,4.71,0,0,1,275.47,251.56Zm25.69,12.09a4.71,4.71,0,0,1-5.9-3l-13.59-35.29a4.43,4.43,0,1,1,8.21-3.17l13.6,35.29A4.71,4.71,0,0,1,301.16,263.65Z" style="opacity:0.23"></path><path d="M165.29,206.11l5.59,68.52,82.28,47.5,13-57.5Zm32.48,67.45a4.73,4.73,0,0,1-5.9-3.06l-13.59-35.29a4.43,4.43,0,1,1,8.21-3.16l13.6,35.28A4.72,4.72,0,0,1,197.77,273.56Zm25.69,12.08a4.71,4.71,0,0,1-5.9-3.05L204,247.3a4.44,4.44,0,1,1,8.22-3.17l13.59,35.29A4.71,4.71,0,0,1,223.46,285.64Zm25.69,12.09a4.7,4.7,0,0,1-5.89-3.05l-13.6-35.29a4.44,4.44,0,1,1,8.22-3.17l13.59,35.29A4.71,4.71,0,0,1,249.15,297.73Z" style="fill:#F30235"></path><g style="opacity:0.15"><path d="M165.29,206.11l5.59,68.52,82.28,47.5,13-57.5Zm32.48,67.45a4.73,4.73,0,0,1-5.9-3.06l-13.59-35.29a4.43,4.43,0,1,1,8.21-3.16l13.6,35.28A4.72,4.72,0,0,1,197.77,273.56Zm25.69,12.08a4.71,4.71,0,0,1-5.9-3.05L204,247.3a4.44,4.44,0,1,1,8.22-3.17l13.59,35.29A4.71,4.71,0,0,1,223.46,285.64Zm25.69,12.09a4.7,4.7,0,0,1-5.89-3.05l-13.6-35.29a4.44,4.44,0,1,1,8.22-3.17l13.59,35.29A4.71,4.71,0,0,1,249.15,297.73Z"></path></g><polygon points="266.15 264.63 322.45 232.12 309.46 289.63 253.16 322.13 266.15 264.63" style="fill:#F30235"></polygon><polygon points="266.15 264.63 322.45 232.12 309.46 289.63 253.16 322.13 266.15 264.63" style="opacity:0.4"></polygon></g></g><g id="freepik--Arrow--inject-33"><g id="freepik--arrow--inject-33"><polygon points="286.43 140.48 279.93 144.29 279.95 124.6 276.01 122.33 258.17 132.63 258.14 156.92 247.74 162.81 271.02 177.91 290.37 142.75 286.43 140.48" style="fill:#37474f"></polygon><polygon points="262.11 134.9 262.08 159.19 251.68 165.09 271.02 177.91 290.37 142.75 279.92 148.89 279.95 124.6 262.11 134.9" style="fill:#455a64"></polygon><polygon points="258.17 132.63 262.11 134.9 262.08 159.19 258.14 156.92 258.17 132.63" style="fill:#263238"></polygon></g></g><g id="freepik--Bag--inject-33"><g id="freepik--bag--inject-33"><polygon points="177.57 155.77 233.95 123.22 229.25 55.4 177.57 85.24 177.57 155.77" style="fill:#F30235"></polygon><polygon points="177.57 155.77 233.95 123.22 229.25 55.4 177.57 85.24 177.57 155.77" style="fill:#fff;opacity:0.6000000000000001"></polygon><polygon points="177.57 85.24 177.57 79.81 163.47 77.1 215.15 47.26 219.85 55.4 229.25 55.4 177.57 85.24" style="fill:#F30235"></polygon><polygon points="177.57 85.24 177.57 79.81 163.47 77.1 215.15 47.26 219.85 55.4 229.25 55.4 177.57 85.24" style="fill:#fff;opacity:0.30000000000000004"></polygon><polygon points="215.15 47.26 215.15 63.54 219.85 60.83 219.85 55.4 215.15 47.26" style="fill:#F30235"></polygon><polygon points="215.15 47.26 215.15 63.54 219.85 60.83 219.85 55.4 215.15 47.26" style="opacity:0.1"></polygon><polygon points="229.25 55.4 219.85 55.4 219.85 60.83 229.25 55.4" style="fill:#F30235"></polygon><polygon points="229.25 55.4 219.85 55.4 219.85 60.83 229.25 55.4" style="opacity:0.2"></polygon><polygon points="163.47 77.1 158.77 144.92 177.57 155.77 177.57 85.24 177.57 79.81 163.47 77.1" style="fill:#F30235"></polygon><polygon points="163.47 77.1 158.77 144.92 177.57 155.77 177.57 85.24 177.57 79.81 163.47 77.1" style="opacity:0.1"></polygon><polygon points="177.57 79.81 168.17 150.34 177.57 155.77 177.57 79.81" style="fill:#F30235"></polygon><polygon points="177.57 79.81 168.17 150.34 177.57 155.77 177.57 79.81" style="opacity:0.2"></polygon><polygon points="177.57 155.77 168.95 144.46 158.77 144.92 177.57 155.77" style="fill:#F30235"></polygon><path d="M178.71,76.38c0,.92.64,1.3,1.44.84a3.22,3.22,0,0,0,1.45-2.51c0-.92-.65-1.3-1.45-.84A3.21,3.21,0,0,0,178.71,76.38Z" style="fill:#37474f"></path><path d="M197.94,65.53c0,.92.65,1.3,1.45.83a3.19,3.19,0,0,0,1.45-2.5c0-.92-.65-1.3-1.45-.84A3.21,3.21,0,0,0,197.94,65.53Z" style="fill:#37474f"></path><path d="M180.15,75.33a.49.49,0,0,1-.48-.48V63c0-5.17,4.42-11.92,9.86-15.06,3-1.75,5.9-2.09,7.89-.94,1.59.91,2.46,2.69,2.46,5V64a.49.49,0,0,1-.49.48.48.48,0,0,1-.48-.48V52c0-2-.69-3.44-2-4.18-1.68-1-4.21-.63-6.92.94-5.17,3-9.38,9.36-9.38,14.22V74.85A.49.49,0,0,1,180.15,75.33Z" style="fill:#37474f"></path><path d="M193,84.52c0,.92.65,1.29,1.45.83a3.19,3.19,0,0,0,1.45-2.5c0-.92-.65-1.3-1.45-.84A3.21,3.21,0,0,0,193,84.52Z" style="fill:#455a64"></path><path d="M212.26,73.67c0,.92.65,1.29,1.45.83a3.19,3.19,0,0,0,1.45-2.5c0-.93-.65-1.3-1.45-.84A3.19,3.19,0,0,0,212.26,73.67Z" style="fill:#455a64"></path><path d="M194.47,83.47A.48.48,0,0,1,194,83V71.13c0-5.16,4.42-11.91,9.86-15,3-1.75,5.9-2.09,7.89-.94,1.58.91,2.45,2.69,2.45,5v12a.48.48,0,0,1-.48.49.49.49,0,0,1-.49-.49v-12c0-2-.68-3.43-2-4.17-1.68-1-4.2-.63-6.92.94-5.17,3-9.37,9.36-9.37,14.21V83A.49.49,0,0,1,194.47,83.47Z" style="fill:#455a64"></path></g></g><g id="freepik--credit-card--inject-33"><g id="freepik--Card--inject-33"><path d="M151.13,442.19l65.43-37.78a3.08,3.08,0,0,0,1.77-2.7c0-1,0-4.64,0-4.64s-1.75,2.5-1.78,2.52L167,428.19l-15.89,9.17a9.47,9.47,0,0,1-8.61,0L43.4,380.15s-1.68-2-1.72-2-.09,3.42,0,4.56A3,3,0,0,0,43.4,385l99.11,57.2A9.46,9.46,0,0,0,151.13,442.19Z" style="fill:#F30235"></path><path d="M151.13,442.19l65.43-37.78a3.08,3.08,0,0,0,1.77-2.7c0-1,0-4.64,0-4.64s-1.75,2.5-1.78,2.52L167,428.19l-15.89,9.17a9.47,9.47,0,0,1-8.61,0L43.4,380.15s-1.68-2-1.72-2-.09,3.42,0,4.56A3,3,0,0,0,43.4,385l99.11,57.2A9.46,9.46,0,0,0,151.13,442.19Z" style="opacity:0.15"></path><path d="M197.7,410.47h0v4.83l18.86-10.89a3.08,3.08,0,0,0,1.77-2.7c0-1,0-4.64,0-4.64s-1.75,2.5-1.78,2.52Z" style="fill:#37474f"></path><path d="M216.57,399.59a.23.23,0,0,0,.09-.08c2.28-1.35,2.24-3.55-.09-4.9l-99.12-57.22a9.53,9.53,0,0,0-8.61,0L43.4,375.17c-2.36,1.36-2.37,3.55-.09,4.91l.09.07,99.1,57.21a9.47,9.47,0,0,0,8.61,0L167,428.19Z" style="fill:#F30235"></path><path d="M197.7,410.47l18.87-10.88a.23.23,0,0,0,.09-.08c2.28-1.35,2.24-3.55-.09-4.9l-99.12-57.22a9.53,9.53,0,0,0-8.61,0L90,348.28Z" style="fill:#455a64"></path><path d="M41.68,378.17s-.09,3.42,0,4.56A3,3,0,0,0,43.4,385l99.11,57.2a9.12,9.12,0,0,0,5.46,1v-4.83a9.32,9.32,0,0,1-5.47-1L43.4,380.15S41.72,378.19,41.68,378.17Z" style="opacity:0.15"></path><path d="M73.76,371.69l-1.92-1.11a.25.25,0,0,1-.14-.17c0-.07,0-.12.1-.17a.6.6,0,0,1,.29-.06.7.7,0,0,1,.3.08l.64.37L75.8,369a.33.33,0,0,0,.2-.33c0-.14-.11-.25-.28-.36h0a.26.26,0,0,1-.15-.18.18.18,0,0,1,.11-.16A.43.43,0,0,1,76,368a.58.58,0,0,1,.3.08h0a1,1,0,0,1,.58.71.66.66,0,0,1-.4.67L73.67,371l.64.37c.09.05.14.11.14.18s0,.12-.1.17a.52.52,0,0,1-.29,0A.56.56,0,0,1,73.76,371.69Z" style="fill:#fff"></path><path d="M79.57,373.13l-1.28-.74a1.31,1.31,0,0,0-.61-.16,1.06,1.06,0,0,0-.58.12l-.41.23s-.06.05,0,.09,0,.06.07.09l2.72,1.57a.25.25,0,0,1,.14.17.16.16,0,0,1-.1.17.52.52,0,0,1-.29.06.75.75,0,0,1-.31-.09l-3.19-1.84a.26.26,0,0,1-.15-.18.16.16,0,0,1,.1-.16l.83-.48a2.08,2.08,0,0,1,1.16-.24,2.71,2.71,0,0,1,1.23.33l1.27.74a1.4,1.4,0,0,0,.62.17,1,1,0,0,0,.58-.12l.55-.31a.34.34,0,0,0,.21-.34.56.56,0,0,0-.3-.36l-1.27-.73a1.36,1.36,0,0,0-.62-.17,1.06,1.06,0,0,0-.58.12.58.58,0,0,1-.28.06.63.63,0,0,1-.31-.09.26.26,0,0,1-.15-.17.17.17,0,0,1,.11-.17,2,2,0,0,1,1.15-.24,2.56,2.56,0,0,1,1.23.34l1.28.74a1,1,0,0,1,.58.71.66.66,0,0,1-.41.66l-.55.32a2.08,2.08,0,0,1-1.16.24A2.63,2.63,0,0,1,79.57,373.13Z" style="fill:#fff"></path><path d="M85.68,377l-.28.16a2.14,2.14,0,0,1-1.15.23A2.67,2.67,0,0,1,83,377l-1.28-.74a1,1,0,0,1-.58-.71.68.68,0,0,1,.41-.67.52.52,0,0,1,.29-.05.65.65,0,0,1,.31.08.27.27,0,0,1,.14.18.15.15,0,0,1-.1.16.33.33,0,0,0-.2.34.48.48,0,0,0,.29.35l1.27.74a1.36,1.36,0,0,0,.62.17,1,1,0,0,0,.57-.12l.28-.16a.33.33,0,0,0,.2-.33.48.48,0,0,0-.29-.36l-.31-.18c-.09-.06-.14-.11-.15-.18s0-.12.1-.17a.64.64,0,0,1,.6,0l.32.18a1.32,1.32,0,0,0,.61.17,1,1,0,0,0,.58-.12l.28-.16a.33.33,0,0,0,.2-.33.5.5,0,0,0-.29-.36l-1.28-.73a1.32,1.32,0,0,0-.61-.17,1.06,1.06,0,0,0-.58.12.51.51,0,0,1-.29.05.62.62,0,0,1-.31-.08.28.28,0,0,1-.14-.17.17.17,0,0,1,.1-.17,2.08,2.08,0,0,1,1.16-.24,2.63,2.63,0,0,1,1.23.34l1.27.73a1,1,0,0,1,.58.71.66.66,0,0,1-.41.67l-.27.16a1.8,1.8,0,0,1-.58.2,3.9,3.9,0,0,1-.69,0,.56.56,0,0,1,0,.4A1,1,0,0,1,85.68,377Z" style="fill:#fff"></path><path d="M89.39,380.62a.62.62,0,0,1-.31-.08.27.27,0,0,1-.14-.18.16.16,0,0,1,.1-.16l1.54-.89a2.54,2.54,0,0,1-.79-.28l-1.28-.74a1,1,0,0,1-.58-.71.66.66,0,0,1,.41-.66l1.38-.8a.62.62,0,0,1,.29-.06.65.65,0,0,1,.31.08.27.27,0,0,1,.14.18c0,.07,0,.12-.1.17l-1.38.8a.34.34,0,0,0-.21.33.53.53,0,0,0,.29.35l1.28.74a1.35,1.35,0,0,0,.61.17,1,1,0,0,0,.58-.12l1.38-.8a.65.65,0,0,1,.29-.06.75.75,0,0,1,.31.08.26.26,0,0,1,.14.18.16.16,0,0,1-.1.17l-3.87,2.24A.51.51,0,0,1,89.39,380.62Z" style="fill:#fff"></path><path d="M99.33,383.1s0,0,0,.09a.18.18,0,0,0,.07.09l1.76,1a1,1,0,0,1,.58.71.67.67,0,0,1-.41.67l-.55.32a2.17,2.17,0,0,1-1.16.23,2.66,2.66,0,0,1-1.22-.33l-1.28-.74a1,1,0,0,1-.58-.71.67.67,0,0,1,.41-.67.62.62,0,0,1,.29-.06.8.8,0,0,1,.31.09.27.27,0,0,1,.14.18.16.16,0,0,1-.1.16.33.33,0,0,0-.21.34.53.53,0,0,0,.29.35l1.28.74a1.31,1.31,0,0,0,.61.16,1,1,0,0,0,.58-.11l.55-.32a.34.34,0,0,0,.21-.34.53.53,0,0,0-.29-.35l-1.92-1.11a.53.53,0,0,1-.29-.35.32.32,0,0,1,.21-.33l1.38-.8a.45.45,0,0,1,.29-.06.61.61,0,0,1,.3.08l3.2,1.84a.27.27,0,0,1,.14.18c0,.07,0,.12-.1.17a.6.6,0,0,1-.29.06.7.7,0,0,1-.3-.09l-2.72-1.57-.15,0a.24.24,0,0,0-.15,0Z" style="fill:#fff"></path><path d="M104.94,386.5l1.28.74a1,1,0,0,1,.58.71.67.67,0,0,1-.41.67l-.55.32a2.15,2.15,0,0,1-1.16.23,2.63,2.63,0,0,1-1.23-.34l-1.27-.73a1,1,0,0,1-.58-.71.66.66,0,0,1,.4-.67l2.22-1.28a2.14,2.14,0,0,1,1.15-.23,2.67,2.67,0,0,1,1.23.33l1.28.74a1,1,0,0,1,.58.71.67.67,0,0,1-.41.67.43.43,0,0,1-.29.06.66.66,0,0,1-.3-.09.26.26,0,0,1-.15-.17c0-.07,0-.12.1-.17s.23-.2.21-.33a.51.51,0,0,0-.3-.36l-1.27-.74a1.35,1.35,0,0,0-.62-.16,1.1,1.1,0,0,0-.57.11l-.71.41A2.63,2.63,0,0,1,104.94,386.5Zm-2.3.59a.33.33,0,0,0-.2.33.5.5,0,0,0,.29.36l1.28.74a1.35,1.35,0,0,0,.61.17,1,1,0,0,0,.58-.12l.56-.32a.33.33,0,0,0,.2-.33.51.51,0,0,0-.3-.36l-1.27-.74a1.36,1.36,0,0,0-.62-.17,1,1,0,0,0-.57.12Z" style="fill:#fff"></path><path d="M112.31,390.91l-3.79.53H108l-.08,0a.36.36,0,0,1-.16-.17q0-.09.12-.18a1.37,1.37,0,0,1,.44-.06c1.21-.17,2.38-.35,3.51-.53a1,1,0,0,0,.33-.09l.27-.1.09-.05a.33.33,0,0,0,.2-.34.48.48,0,0,0-.29-.35l-.64-.37-.31-.18-1.28-.74a.26.26,0,0,1-.15-.18.16.16,0,0,1,.1-.16.46.46,0,0,1,.29-.06.62.62,0,0,1,.31.08l1.28.74.32.18.64.37a1,1,0,0,1,.57.71.66.66,0,0,1-.4.67,3.39,3.39,0,0,1-.45.19A2.28,2.28,0,0,1,112.31,390.91Z" style="fill:#fff"></path><path d="M116.33,394.67l-.28.16a2,2,0,0,1-1.15.24,2.56,2.56,0,0,1-1.23-.34l-1.28-.73a1,1,0,0,1-.58-.71.68.68,0,0,1,.41-.67l.28-.16a1.82,1.82,0,0,1,.57-.2,2.63,2.63,0,0,1,.69,0,.62.62,0,0,1,0-.4,1,1,0,0,1,.35-.33l.27-.16a2.17,2.17,0,0,1,1.16-.23,2.74,2.74,0,0,1,1.23.33l1.27.74a1,1,0,0,1,.58.71.66.66,0,0,1-.4.67l-.28.16a1.8,1.8,0,0,1-.58.19,2.63,2.63,0,0,1-.69,0,.56.56,0,0,1,0,.4A.83.83,0,0,1,116.33,394.67Zm1.3-1.48a.33.33,0,0,0,.2-.34.5.5,0,0,0-.29-.35l-1.28-.74a1.32,1.32,0,0,0-.61-.17,1.28,1.28,0,0,0-.58.12l-.27.16a.33.33,0,0,0-.21.34.53.53,0,0,0,.29.35l1.28.74a1.31,1.31,0,0,0,.61.16,1.14,1.14,0,0,0,.58-.11Zm-1.94,1.11a.31.31,0,0,0,.2-.33.48.48,0,0,0-.29-.35l-1.27-.74a1.36,1.36,0,0,0-.62-.17,1,1,0,0,0-.57.12l-.28.16a.33.33,0,0,0-.2.33.48.48,0,0,0,.29.36l1.27.73a1.25,1.25,0,0,0,.62.17,1,1,0,0,0,.57-.12Z" style="fill:#fff"></path><path d="M123.89,400.63l-1.28-.74a1,1,0,0,1-.58-.7.66.66,0,0,1,.41-.67.6.6,0,0,1,.29-.06.66.66,0,0,1,.31.09.28.28,0,0,1,.14.17.17.17,0,0,1-.1.17.34.34,0,0,0-.21.33.52.52,0,0,0,.29.36l1.28.73a1.36,1.36,0,0,0,.62.17,1.16,1.16,0,0,0,.58-.11l.7-.41a2.54,2.54,0,0,1-.8-.29l-1.27-.73a1,1,0,0,1-.58-.71.67.67,0,0,1,.41-.67l.55-.32a2.17,2.17,0,0,1,1.16-.23,2.66,2.66,0,0,1,1.22.33l1.28.74a1,1,0,0,1,.58.71.66.66,0,0,1-.4.67l-2.22,1.27a2,2,0,0,1-1.15.24A2.56,2.56,0,0,1,123.89,400.63Zm4-1.54a.33.33,0,0,0,.2-.34.48.48,0,0,0-.29-.35l-1.28-.74a1.35,1.35,0,0,0-.61-.17,1,1,0,0,0-.58.12l-.55.32a.34.34,0,0,0-.21.33.52.52,0,0,0,.29.36l1.28.73a1.21,1.21,0,0,0,.61.17,1.08,1.08,0,0,0,.59-.11Z" style="fill:#fff"></path><path d="M128.67,403.4l-1.91-1.11a.26.26,0,0,1-.15-.18.15.15,0,0,1,.1-.16.45.45,0,0,1,.29-.06.62.62,0,0,1,.31.08l.64.37,2.76-1.6a.35.35,0,0,0,.21-.33.51.51,0,0,0-.28-.35h0a.26.26,0,0,1-.15-.17c0-.07,0-.12.1-.17a.62.62,0,0,1,.29-.06.54.54,0,0,1,.31.09h0a1,1,0,0,1,.58.7.67.67,0,0,1-.41.67l-2.76,1.6.63.37a.26.26,0,0,1,.15.17.17.17,0,0,1-.11.17.49.49,0,0,1-.28.06A.75.75,0,0,1,128.67,403.4Z" style="fill:#fff"></path><path d="M132.83,405.79l-1.28-.73a1,1,0,0,1-.58-.71.67.67,0,0,1,.41-.67l2.21-1.28a2.17,2.17,0,0,1,1.16-.23,2.66,2.66,0,0,1,1.22.33l1.28.74a1,1,0,0,1,.58.71.67.67,0,0,1-.41.67l-2.21,1.27a2.08,2.08,0,0,1-1.16.24A2.55,2.55,0,0,1,132.83,405.79Zm-.73-1.05,1.28.74a1.6,1.6,0,0,0,.37.13l.43-2.81L132,404.05a.34.34,0,0,0-.21.33A.52.52,0,0,0,132.1,404.74Zm4.6-1.18-1.28-.74a1.35,1.35,0,0,0-.37-.13l-.43,2.81,2.16-1.25a.34.34,0,0,0,.21-.34A.53.53,0,0,0,136.7,403.56Z" style="fill:#fff"></path><path d="M137.61,408.56l-1.92-1.11a.27.27,0,0,1-.14-.18.15.15,0,0,1,.1-.16.45.45,0,0,1,.29-.06.62.62,0,0,1,.31.08l.64.37,2.76-1.6a.34.34,0,0,0,.21-.33.53.53,0,0,0-.29-.35h0a.28.28,0,0,1-.14-.17c0-.07,0-.12.1-.17a.64.64,0,0,1,.6,0h0a1,1,0,0,1,.58.7.66.66,0,0,1-.41.67l-2.77,1.6.64.37a.26.26,0,0,1,.15.18.18.18,0,0,1-.11.16.5.5,0,0,1-.29.06A.74.74,0,0,1,137.61,408.56Z" style="fill:#fff"></path><path d="M146.55,413.72l-1.92-1.11a.28.28,0,0,1-.14-.17.16.16,0,0,1,.1-.17.62.62,0,0,1,.29-.06.75.75,0,0,1,.31.08l.64.37,2.76-1.6a.34.34,0,0,0,.21-.33.51.51,0,0,0-.28-.35h0c-.09-.06-.14-.11-.15-.18s0-.12.1-.17a.62.62,0,0,1,.29-.06.75.75,0,0,1,.31.09h0a1,1,0,0,1,.58.71.67.67,0,0,1-.41.66l-2.77,1.6.64.37a.26.26,0,0,1,.15.18.18.18,0,0,1-.11.16.43.43,0,0,1-.29.06A.61.61,0,0,1,146.55,413.72Z" style="fill:#fff"></path><path d="M152.36,415.16l-1.27-.74a1.36,1.36,0,0,0-.62-.17,1,1,0,0,0-.57.12l-.42.24a.08.08,0,0,0,0,.08.13.13,0,0,0,.07.09l2.72,1.57c.09,0,.14.11.14.18s0,.12-.1.17a.6.6,0,0,1-.29.06.7.7,0,0,1-.3-.09l-3.2-1.84a.24.24,0,0,1-.14-.18c0-.07,0-.12.1-.17l.83-.48a2.14,2.14,0,0,1,1.15-.23,2.67,2.67,0,0,1,1.23.33l1.28.74a1.32,1.32,0,0,0,.61.17,1,1,0,0,0,.58-.12l.56-.32a.33.33,0,0,0,.2-.33.52.52,0,0,0-.29-.36l-1.28-.74a1.35,1.35,0,0,0-.61-.16,1,1,0,0,0-.58.12.54.54,0,0,1-.29,0,.62.62,0,0,1-.31-.08.27.27,0,0,1-.14-.18.15.15,0,0,1,.1-.16,2.06,2.06,0,0,1,1.16-.24,2.55,2.55,0,0,1,1.22.34l1.28.73a1,1,0,0,1,.58.71.65.65,0,0,1-.4.67l-.56.32a2,2,0,0,1-1.15.24A2.75,2.75,0,0,1,152.36,415.16Z" style="fill:#fff"></path><path d="M155.49,418.88l-1.92-1.11a.28.28,0,0,1-.14-.17.16.16,0,0,1,.1-.17.62.62,0,0,1,.29-.06.75.75,0,0,1,.31.08l.64.37,2.76-1.59a.33.33,0,0,0,.2-.33.48.48,0,0,0-.28-.36h0a.27.27,0,0,1-.14-.18c0-.07,0-.12.1-.16a.52.52,0,0,1,.29-.07.8.8,0,0,1,.31.09h0a1,1,0,0,1,.58.71.66.66,0,0,1-.41.66l-2.77,1.6.64.37a.26.26,0,0,1,.15.18.18.18,0,0,1-.11.16.43.43,0,0,1-.29.06A.61.61,0,0,1,155.49,418.88Z" style="fill:#fff"></path><path d="M162.3,421.22l-.27.16a2.17,2.17,0,0,1-1.16.23,2.66,2.66,0,0,1-1.22-.33l-1.28-.74a1,1,0,0,1-.58-.71.67.67,0,0,1,.41-.67.49.49,0,0,1,.28-.05.62.62,0,0,1,.31.08.26.26,0,0,1,.15.18.18.18,0,0,1-.1.16.33.33,0,0,0-.21.34.5.5,0,0,0,.29.35l1.28.74a1.32,1.32,0,0,0,.61.17,1,1,0,0,0,.58-.12l.28-.16a.33.33,0,0,0,.2-.34.5.5,0,0,0-.29-.35l-.32-.18a.3.3,0,0,1-.15-.18.19.19,0,0,1,.11-.17.58.58,0,0,1,.28-.06.75.75,0,0,1,.31.09l.32.18a1.36,1.36,0,0,0,.62.17,1.06,1.06,0,0,0,.58-.12l.27-.16a.35.35,0,0,0,.21-.33.54.54,0,0,0-.29-.36l-1.28-.73a1.25,1.25,0,0,0-.62-.17,1,1,0,0,0-.57.12.65.65,0,0,1-.29.06.75.75,0,0,1-.31-.09.26.26,0,0,1-.15-.18.18.18,0,0,1,.11-.16,2,2,0,0,1,1.15-.24,2.56,2.56,0,0,1,1.23.34l1.28.73a1,1,0,0,1,.58.71.67.67,0,0,1-.41.67l-.28.16a1.82,1.82,0,0,1-.57.2,3.9,3.9,0,0,1-.69,0,.59.59,0,0,1,0,.39A.88.88,0,0,1,162.3,421.22Z" style="fill:#fff"></path><path d="M141.41,421l-1.12-.65s-.08-.06-.08-.1,0-.07,0-.1a.43.43,0,0,1,.17,0,.35.35,0,0,1,.18.05l.38.21,1.61-.93a.19.19,0,0,0,.12-.19.32.32,0,0,0-.16-.21h0a.19.19,0,0,1-.09-.11.11.11,0,0,1,.06-.09.31.31,0,0,1,.17,0,.48.48,0,0,1,.18.05h0a.59.59,0,0,1,.34.42.4.4,0,0,1-.24.39l-1.61.93.37.21a.19.19,0,0,1,.09.11.09.09,0,0,1-.07.09.27.27,0,0,1-.16,0A.48.48,0,0,1,141.41,421Z" style="fill:#fff"></path><path d="M144.8,421.85l-.74-.43a.84.84,0,0,0-.36-.1.69.69,0,0,0-.34.07l-.24.14a.05.05,0,0,0,0,.05.07.07,0,0,0,0,.05l1.59.92c.05,0,.08.06.08.1s0,.07-.06.1a.23.23,0,0,1-.17,0,.34.34,0,0,1-.17,0l-1.87-1.07a.14.14,0,0,1-.08-.11.08.08,0,0,1,.05-.09l.49-.28a1.17,1.17,0,0,1,.67-.14,1.51,1.51,0,0,1,.72.19l.75.43a.69.69,0,0,0,.36.1.49.49,0,0,0,.33-.07l.33-.18a.2.2,0,0,0,.12-.2c0-.08-.07-.14-.18-.21l-.74-.43a.8.8,0,0,0-.36-.09.52.52,0,0,0-.34.07.4.4,0,0,1-.17,0,.34.34,0,0,1-.17-.05.17.17,0,0,1-.09-.1.12.12,0,0,1,.06-.1,1.27,1.27,0,0,1,.68-.14,1.47,1.47,0,0,1,.71.2l.75.43a.59.59,0,0,1,.34.41.38.38,0,0,1-.24.39l-.32.19a1.29,1.29,0,0,1-.68.14A1.55,1.55,0,0,1,144.8,421.85Z" style="fill:#fff"></path><path d="M149.28,424.43l-.75-.43a.69.69,0,0,0-.36-.09.58.58,0,0,0-.33.06l-.25.14s0,0,0,.05a.08.08,0,0,0,.05,0l1.58.92a.17.17,0,0,1,.09.1.11.11,0,0,1-.06.1.31.31,0,0,1-.17,0,.48.48,0,0,1-.18-.05L147,424.24c-.05,0-.08-.06-.08-.1a.08.08,0,0,1,.06-.1l.48-.28a1.29,1.29,0,0,1,.68-.14,1.47,1.47,0,0,1,.71.2l.75.43a.8.8,0,0,0,.36.1.69.69,0,0,0,.34-.07l.32-.19c.09,0,.13-.11.12-.19a.31.31,0,0,0-.17-.21l-.75-.43a.8.8,0,0,0-.36-.1.58.58,0,0,0-.33.07.31.31,0,0,1-.17,0,.48.48,0,0,1-.18,0,.19.19,0,0,1-.09-.11.12.12,0,0,1,.06-.1,1.21,1.21,0,0,1,.68-.13,1.54,1.54,0,0,1,.72.19l.74.43a.59.59,0,0,1,.34.42.4.4,0,0,1-.24.39l-.32.18a1.17,1.17,0,0,1-.67.14A1.48,1.48,0,0,1,149.28,424.43Z" style="fill:#fff"></path><path d="M152.84,426.68l-.16.09a1.17,1.17,0,0,1-.67.14,1.55,1.55,0,0,1-.72-.2l-.74-.43a.56.56,0,0,1-.34-.41.38.38,0,0,1,.24-.39.26.26,0,0,1,.16,0,.34.34,0,0,1,.18,0,.19.19,0,0,1,.09.11.12.12,0,0,1-.06.1c-.09.05-.13.11-.12.19a.31.31,0,0,0,.17.21l.74.43a.88.88,0,0,0,.36.1.69.69,0,0,0,.34-.07l.16-.1c.09,0,.13-.11.12-.19a.31.31,0,0,0-.17-.21l-.19-.11s-.08-.06-.08-.1,0-.07.06-.1a.4.4,0,0,1,.17,0,.37.37,0,0,1,.18,0l.18.11a.74.74,0,0,0,.36.09.52.52,0,0,0,.34-.07l.16-.09a.19.19,0,0,0,.12-.19.31.31,0,0,0-.17-.21l-.74-.43a.88.88,0,0,0-.36-.1.69.69,0,0,0-.34.07.24.24,0,0,1-.17,0,.48.48,0,0,1-.18,0,.14.14,0,0,1-.08-.11s0-.07.06-.1a1.26,1.26,0,0,1,.67-.13,1.54,1.54,0,0,1,.72.19l.74.43a.59.59,0,0,1,.34.42.4.4,0,0,1-.24.39l-.16.09a1,1,0,0,1-.33.11,1.4,1.4,0,0,1-.41,0,.34.34,0,0,1,0,.24A.46.46,0,0,1,152.84,426.68Z" style="fill:#fff"></path><path d="M145.05,423.56h0a.13.13,0,0,1,.07-.16l3.24-1.35a.12.12,0,0,1,.16.07.12.12,0,0,1-.06.16l-3.24,1.35A.13.13,0,0,1,145.05,423.56Z" style="fill:#fff"></path><path d="M183.84,408.51,173,414.77a3.24,3.24,0,0,1-2.94,0l-13.23-7.54a.89.89,0,0,1,0-1.69l10.84-6.26a3.24,3.24,0,0,1,2.94,0c3.58,2.07,9.64,5.46,13.22,7.54A.89.89,0,0,1,183.84,408.51Z" style="fill:#F30235"></path><g style="clip-path:url(#freepik--clip-path--inject-33)"><path d="M183.84,408.51,173,414.77a3.24,3.24,0,0,1-2.94,0l-13.23-7.54a.89.89,0,0,1,0-1.69l10.84-6.26a3.24,3.24,0,0,1,2.94,0c3.58,2.07,9.64,5.46,13.22,7.54A.89.89,0,0,1,183.84,408.51Z" style="fill:#fff;opacity:0.8"></path><polygon points="183.44 411.74 184.43 411.54 162.76 399.13 161.76 399.32 183.44 411.74" style="fill:#F30235"></polygon><polygon points="169.65 409.96 170.65 410.15 176.17 406.96 175.17 406.77 169.65 409.96" style="fill:#F30235"></polygon><polygon points="164.49 407.1 165.49 407.29 171 404.11 170.01 403.92 164.49 407.1" style="fill:#F30235"></polygon><polygon points="177.9 414.93 178.9 414.74 157.23 402.32 156.23 402.52 177.9 414.93" style="fill:#F30235"></polygon></g><path d="M114.69,407.15,62.91,377.26a3.6,3.6,0,0,0-3.26,0l-.23.13a1,1,0,0,0,0,1.88l51.79,29.9a3.6,3.6,0,0,0,3.26,0l.22-.13A1,1,0,0,0,114.69,407.15Z" style="fill:#455a64"></path><path d="M109.88,349.77a.79.79,0,0,1,.3,0,.62.62,0,0,1,.26.07l.81.47c.08.05.12.1.12.16s0,.12-.12.16a4.43,4.43,0,0,1-1,.36,5.29,5.29,0,0,1-1.29.12,6.55,6.55,0,0,1-1.46-.22,6.18,6.18,0,0,1-1.55-.65,3.53,3.53,0,0,1-1-.83,1.41,1.41,0,0,1-.33-.86,1.37,1.37,0,0,1,.3-.84,3.56,3.56,0,0,1,.87-.79l.83-.5.87-.48a5.91,5.91,0,0,1,1.37-.5,6,6,0,0,1,1.46-.18,6.26,6.26,0,0,1,1.48.19,5.64,5.64,0,0,1,1.44.6,4,4,0,0,1,1.13.89,1.61,1.61,0,0,1,.37.85,1.12,1.12,0,0,1-.21.74,2.49,2.49,0,0,1-.61.6.5.5,0,0,1-.27.07.77.77,0,0,1-.28-.07l-.82-.48a.21.21,0,0,1-.12-.14q0-.09.09-.18a.93.93,0,0,0,.25-.31.67.67,0,0,0,0-.37,1,1,0,0,0-.24-.43,2.32,2.32,0,0,0-.59-.45,2.79,2.79,0,0,0-.81-.32,3.21,3.21,0,0,0-.81-.1,3.49,3.49,0,0,0-.79.1,3.27,3.27,0,0,0-.72.28l-.87.47-.82.5a2.28,2.28,0,0,0-.48.42.77.77,0,0,0-.17.45.72.72,0,0,0,.16.47,1.76,1.76,0,0,0,.57.47,3.3,3.3,0,0,0,.78.34,3.46,3.46,0,0,0,.73.14,2.86,2.86,0,0,0,.66,0A2,2,0,0,0,109.88,349.77Z" style="fill:#F30235"></path><path d="M120.14,350.13c.84.49,1.29,1,1.33,1.45s-.27.91-1,1.31a4.15,4.15,0,0,1-1.6.53,4.61,4.61,0,0,1-1.76-.13l-1.1,2.25-.08.08a.52.52,0,0,1-.23.05.51.51,0,0,1-.22-.05l-.86-.5c-.13-.07-.2-.15-.2-.22a.36.36,0,0,1,0-.19l1-2.12-1.34-.77-2.35,1.36a.6.6,0,0,1-.27.06.61.61,0,0,1-.28-.06l-.81-.47a.19.19,0,0,1-.11-.16.18.18,0,0,1,.11-.16l6.51-3.76a.51.51,0,0,1,.28-.07.47.47,0,0,1,.27.07Zm-4.69,1,1.46.85a3.19,3.19,0,0,0,1.12.41,1.74,1.74,0,0,0,1.11-.24c.38-.22.52-.43.42-.64a1.83,1.83,0,0,0-.73-.64l-1.46-.84Z" style="fill:#F30235"></path><path d="M122.93,358.44a.16.16,0,0,1,0,.31l-.72.42a.64.64,0,0,1-.54,0l-4.43-2.56a.18.18,0,0,1-.11-.16.19.19,0,0,1,.11-.16l6.52-3.76a.54.54,0,0,1,.27-.06.57.57,0,0,1,.27.06l4.35,2.51a.19.19,0,0,1,.11.16.21.21,0,0,1-.11.16l-.72.41a.64.64,0,0,1-.54,0l-3.26-1.88-1.61.92,3,1.76a.18.18,0,0,1,.11.16.16.16,0,0,1-.11.15l-.71.42a.61.61,0,0,1-.28.06.54.54,0,0,1-.27-.06l-3-1.76-1.67,1Z" style="fill:#F30235"></path><path d="M133,357.56a4,4,0,0,1,1.1.87,1.43,1.43,0,0,1,.36.85,1.3,1.3,0,0,1-.32.83,3.49,3.49,0,0,1-.91.8c-.47.31-1,.59-1.49.87a6.91,6.91,0,0,1-1.39.52,5.43,5.43,0,0,1-1.44.19,5.7,5.7,0,0,1-1.46-.2,6.16,6.16,0,0,1-1.47-.62l-2.54-1.47a.16.16,0,0,1,0-.31l6.52-3.77a.57.57,0,0,1,.27-.06.61.61,0,0,1,.28.06Zm-1.13,2.57a2,2,0,0,0,.47-.42.77.77,0,0,0,.17-.46.8.8,0,0,0-.19-.49,2.25,2.25,0,0,0-.64-.5l-1.35-.78-4.54,2.62,1.4.81a3.33,3.33,0,0,0,1.66.46,3.49,3.49,0,0,0,.79-.1,3.35,3.35,0,0,0,.73-.28C130.92,360.72,131.42,360.43,131.89,360.13Z" style="fill:#F30235"></path><path d="M130.57,364.3a.16.16,0,0,1-.11-.15.17.17,0,0,1,.11-.16l6.51-3.76a.51.51,0,0,1,.28-.07.47.47,0,0,1,.27.07l.82.47a.16.16,0,0,1,0,.31l-6.52,3.77a.6.6,0,0,1-.27.06.61.61,0,0,1-.28-.06Z" style="fill:#F30235"></path><path d="M145,364.48a.18.18,0,0,1,.11.16q0,.09-.12.15l-.71.42a.6.6,0,0,1-.27.06.61.61,0,0,1-.28-.06l-1.81-1-5.53,3.19a.71.71,0,0,1-.27.07.77.77,0,0,1-.28-.07l-.81-.47a.21.21,0,0,1-.12-.16.19.19,0,0,1,.12-.15l5.53-3.2-1.82-1.05a.16.16,0,0,1-.11-.15.17.17,0,0,1,.11-.16l.72-.42a.54.54,0,0,1,.27-.06.57.57,0,0,1,.27.06Z" style="fill:#F30235"></path><path d="M147.84,371.69a.63.63,0,0,1,.3-.05.57.57,0,0,1,.25.07l.82.47a.18.18,0,0,1,.12.16q0,.09-.12.15a4.43,4.43,0,0,1-1,.36,5.29,5.29,0,0,1-1.29.12,6.51,6.51,0,0,1-1.46-.21,5.87,5.87,0,0,1-1.55-.66,3.24,3.24,0,0,1-1-.83,1.38,1.38,0,0,1-.33-.85,1.32,1.32,0,0,1,.3-.85,3.57,3.57,0,0,1,.87-.79l.83-.5c.31-.18.6-.33.87-.47a6.23,6.23,0,0,1,1.37-.51,5.55,5.55,0,0,1,1.46-.17,5.78,5.78,0,0,1,1.48.19,5.27,5.27,0,0,1,1.44.59,3.83,3.83,0,0,1,1.13.9,1.55,1.55,0,0,1,.37.84,1.13,1.13,0,0,1-.21.75,2.29,2.29,0,0,1-.61.59.44.44,0,0,1-.28.07.6.6,0,0,1-.27-.07l-.82-.47a.25.25,0,0,1-.12-.15c0-.06,0-.12.08-.18a.91.91,0,0,0,.26-.3.7.7,0,0,0,0-.38,1,1,0,0,0-.24-.42,2.32,2.32,0,0,0-.59-.45,3.14,3.14,0,0,0-.81-.33,3.25,3.25,0,0,0-.81-.09,3,3,0,0,0-.79.1,3.83,3.83,0,0,0-.72.27l-.87.48-.82.5a1.83,1.83,0,0,0-.48.42.86.86,0,0,0-.18.45.85.85,0,0,0,.17.47,1.9,1.9,0,0,0,.57.47,3.77,3.77,0,0,0,.78.34,4.24,4.24,0,0,0,.73.14,3.56,3.56,0,0,0,.66,0A2,2,0,0,0,147.84,371.69Z" style="fill:#F30235"></path><path d="M158.48,372.26c.1.06.16.13.15.19a.4.4,0,0,1-.11.23l-3.91,5.11s0,0-.06,0a.64.64,0,0,1-.54,0l-.73-.42c-.13-.08-.2-.15-.2-.21a.43.43,0,0,1,.06-.17l.68-.89-3.19-1.84-1.55.39a1.09,1.09,0,0,1-.28,0,.65.65,0,0,1-.37-.11l-.72-.42a.17.17,0,0,1-.11-.16.18.18,0,0,1,.11-.15l.08,0,8.85-2.25a1.68,1.68,0,0,1,.4-.07.68.68,0,0,1,.33.09Zm-3.88,2.88,1.77-2.3-4,1Z" style="fill:#F30235"></path><path d="M165.14,376.11c.84.48,1.28,1,1.33,1.44s-.28.92-1,1.32a4.2,4.2,0,0,1-1.6.53,4.61,4.61,0,0,1-1.76-.13l-1.1,2.24a.2.2,0,0,1-.08.08.41.41,0,0,1-.23.06.4.4,0,0,1-.22-.06l-.85-.49c-.14-.08-.21-.16-.21-.23a.48.48,0,0,1,0-.18l1-2.12-1.34-.77-2.35,1.35a.47.47,0,0,1-.27.07.45.45,0,0,1-.27-.07l-.82-.47a.17.17,0,0,1-.11-.16.16.16,0,0,1,.11-.15L162,374.6a.64.64,0,0,1,.54,0Zm-4.7,1,1.46.84a3.41,3.41,0,0,0,1.13.42,1.67,1.67,0,0,0,1.1-.25q.57-.33.42-.63a1.7,1.7,0,0,0-.73-.64l-1.46-.85Z" style="fill:#F30235"></path><path d="M171.89,380a3.89,3.89,0,0,1,1.1.86,1.34,1.34,0,0,1,.36.85,1.39,1.39,0,0,1-.31.84,3.94,3.94,0,0,1-.92.8c-.47.3-1,.59-1.49.86a7.1,7.1,0,0,1-1.39.53,5.78,5.78,0,0,1-1.43.18,5.72,5.72,0,0,1-1.47-.2,6.3,6.3,0,0,1-1.46-.61l-2.54-1.47a.19.19,0,0,1-.11-.16.18.18,0,0,1,.11-.16l6.51-3.76a.5.5,0,0,1,.28-.06.47.47,0,0,1,.27.06Zm-1.13,2.56a2,2,0,0,0,.48-.42.77.77,0,0,0,.17-.46.82.82,0,0,0-.2-.49,2.15,2.15,0,0,0-.63-.49l-1.35-.78-4.54,2.62,1.4.81a3.09,3.09,0,0,0,.83.34,3,3,0,0,0,.83.11,3.06,3.06,0,0,0,.79-.1,3.56,3.56,0,0,0,.73-.28C169.79,383.19,170.29,382.9,170.76,382.6Z" style="fill:#F30235"></path></g></g><g id="freepik--Character--inject-33"><g id="freepik--character--inject-33"><path d="M387.24,122.1c-2.91,6.26-7.89,16.62-10.62,22.36l-10.68-12.58h-9s10.8,23,17.24,28.38a5.08,5.08,0,0,0,7.37-.44,95,95,0,0,0,7.23-10c5.1-7.88,7.38-11.28,7.38-11.28l6.42-27C397,111.12,391.28,113.41,387.24,122.1Z" style="fill:#ffa8a7"></path><path d="M403.65,111.51c-3.43-.13-7.16-.56-10.43,2.3a26.6,26.6,0,0,0-7.14,10c-2.21,5.2-5.63,11.79-5.63,11.79a28.75,28.75,0,0,0,6.4,6.68,16.21,16.21,0,0,0,7.69,3.23Z" style="fill:#F30235"></path><path d="M403.65,111.51c-3.43-.13-7.16-.56-10.43,2.3a26.6,26.6,0,0,0-7.14,10c-2.21,5.2-5.63,11.79-5.63,11.79a28.75,28.75,0,0,0,6.4,6.68,16.21,16.21,0,0,0,7.69,3.23Z" style="opacity:0.45"></path><path d="M376.62,144.46a38.18,38.18,0,0,1,3.29,4.48s-1.15-4.24-2.71-5.69Z" style="fill:#f28f8f"></path><path d="M354.27,115.17h0l.85-.89h0a1.07,1.07,0,0,1,.95-.2l10.34,1.76a3.71,3.71,0,0,1,2.47,1.89l9.3,20.21a1,1,0,0,1,0,1.09h0l-.88.92h0a1.06,1.06,0,0,1-1,.2L366,138.4a3.72,3.72,0,0,1-2.47-1.9l-9.3-20.21C354,115.79,354,115.39,354.27,115.17Z" style="fill:#455a64"></path><path d="M377.3,138.85,368,118.63a3.73,3.73,0,0,0-2.47-1.89L355.19,115c-1-.16-1.4.42-1,1.31l9.3,20.21a3.72,3.72,0,0,0,2.47,1.9l10.34,1.75C377.26,140.32,377.71,139.73,377.3,138.85Z" style="fill:#263238"></path><path d="M366.69,117.21a3.66,3.66,0,0,1,1.32,1.43l9.3,20.2a1,1,0,0,1,0,1.06l.83-.86h0a1,1,0,0,0,0-1.08l-9.3-20.21a3.46,3.46,0,0,0-1.22-1.35Z" style="fill:#37474f"></path><path d="M359.16,135.16c-4.28-4.91-4.16-11.06-2.19-12.84l1.3,2.84s6.55,1.46,9.7,1.22,5.72-1,6.58-.38c1.83,1.29,2.36,6.77-2.88,8.77C367.22,136.46,359.16,135.16,359.16,135.16Z" style="fill:#ffa8a7"></path><g id="freepik--Botom--inject-33"><path d="M434.41,296.51c-2.77,1.49-6.14,1.37-9.42,0l-1.37-17.92L434.41,280Z" style="fill:#ffa8a7"></path><path d="M401.34,285.8c-2.33,5.05-6.55,3.65-11.3.42l.84-18h11.45Z" style="fill:#ffa8a7"></path><path d="M414.23,313.47a4.11,4.11,0,0,0,.12,2.77c.36.56,2.42,2.33,6.16,2.59,3.57.26,6.76-.22,8.85-1.55s3.11-2.8,3.31-4.83,0-4,.94-5.57,2.32-3.07,2.63-3.85a7.88,7.88,0,0,0,0-4.14Z" style="fill:#263238"></path><path d="M424,295.72a9.91,9.91,0,0,1-.43,2.26,21.13,21.13,0,0,1-2.19,4.48,20.46,20.46,0,0,1-1.49,2.1c-1.08,1.28-2.42,2.33-3.56,3.57a7.25,7.25,0,0,0-2.21,4.38c-.15,2.8,2.89,3.75,5.23,4.17a17.27,17.27,0,0,0,7.6-.38,7,7,0,0,0,5.12-5.58c.13-.78.08-1.58.18-2.36a11.09,11.09,0,0,1,2.17-4.9,14.28,14.28,0,0,0,1.67-2.66c.73-1.74.15-3.69-.32-5.41-.4-1.49-.86-3.18-1.38-3a1.85,1.85,0,0,1-.13.9,4,4,0,0,0-.41.88,6.89,6.89,0,0,1-.42,1.15,3,3,0,0,1-1.25,1.37c0-1-.07-2.11-.1-3.17a1.48,1.48,0,0,0-.24-.93,1.51,1.51,0,0,0-.9-.39,19.55,19.55,0,0,0-6-.49,1,1,0,0,0-.8.35,1.16,1.16,0,0,0-.14.71A27.08,27.08,0,0,1,424,295.72Z" style="fill:#37474f"></path><path d="M421,303c1-.78,3.38-.79,4.66-.65a7.77,7.77,0,0,1,3.63,1.27.83.83,0,0,0,1.07-.08h0a.79.79,0,0,0-.08-1.19,7.88,7.88,0,0,0-4.09-1.52c-3.14-.22-4.06.32-4.06.32S420.71,302.11,421,303Z" style="fill:#f5f5f5"></path><path d="M418.62,305.91c1.32-.77,3.88-.66,5.16-.53a7.35,7.35,0,0,1,3.53,1.35.82.82,0,0,0,1.07-.09h0a.77.77,0,0,0-.08-1.19,8.19,8.19,0,0,0-4.17-1.63c-3.14-.22-4,.42-4,.42A2.6,2.6,0,0,0,418.62,305.91Z" style="fill:#f5f5f5"></path><path d="M427.46,297.87a7.65,7.65,0,0,0-3.95.33c-.55.31-.92,1.18-.56,1.4a7.34,7.34,0,0,1,3.5-.48,10.45,10.45,0,0,1,3.4.94c.27.12.59.28.87.44a.74.74,0,0,0,1-.32h0a.69.69,0,0,0-.27-.9A10.05,10.05,0,0,0,427.46,297.87Z" style="fill:#f5f5f5"></path><path d="M371.28,297.32a3.39,3.39,0,0,0,.14,2.49c.35.73,4.16,2.88,9.3,2.53a21.31,21.31,0,0,0,10.62-3.71c2-1.3,4-1.54,6.54-1.69s5.89-1.41,6.44-2.6a5.63,5.63,0,0,0-.08-3.24Z" style="fill:#263238"></path><path d="M391.93,281.52,390.6,281a1.07,1.07,0,0,0-.76-.08c-.33.12-.46.51-.55.85a12.77,12.77,0,0,1-.56,2.23,5.45,5.45,0,0,1-1.44,1.51,23.42,23.42,0,0,1-4.11,2.65c-1.68.9-3.32,1.6-5.06,2.38s-4.11,1.28-5.49,2.22c-2,1.36-2.28,4.77,0,6.12,2,1.16,7.19,2.42,12.66.87,3-.84,6.28-4,10.19-4.33,2.49-.19,7.19-.89,8.79-2.78.59-.84-.2-3.49-.84-5.78-.71-2.51-1-6.42-1.81-6.2-.06.83-.78,1.32-1.22,2a15.46,15.46,0,0,0-.89,2,3.59,3.59,0,0,1-1.3,1.71,1.65,1.65,0,0,1-2-.11c-.73-.76-.3-2.09-.83-3a3.09,3.09,0,0,0-1.75-1.15Z" style="fill:#37474f"></path><path d="M385.5,286.84a2.33,2.33,0,0,1,1.84-1.23c1.13-.21,3.13.62,4.37,1.65a.92.92,0,0,1-.14,1.53h0a.92.92,0,0,1-1.06-.12A7.09,7.09,0,0,0,385.5,286.84Z" style="fill:#f5f5f5"></path><path d="M382,288.8a2.66,2.66,0,0,1,2.18-1.12,8.31,8.31,0,0,1,4.78,1.79.9.9,0,0,1-.12,1.48h0a.87.87,0,0,1-1-.11A7.11,7.11,0,0,0,382,288.8Z" style="fill:#f5f5f5"></path><path d="M378.12,290.57a3,3,0,0,1,2.26-1,7.92,7.92,0,0,1,4.58,1.81.9.9,0,0,1-.12,1.48h0a.89.89,0,0,1-1-.12A6.82,6.82,0,0,0,378.12,290.57Z" style="fill:#f5f5f5"></path><path d="M433,161.62c.64,19.61.59,67,.59,67,.21,2.44,1.2,7.45,2,17.21,1.06,12.71-1.23,40.64-1.23,40.64a13,13,0,0,1-10.24.06S418,246.76,416.1,234.2c-1.71-11-5.06-35.84-5.06-35.84l-3.87,32.24a65.85,65.85,0,0,1-.39,16.12c-.9,5.78-4.9,29.54-4.9,29.54a20.26,20.26,0,0,1-11.36-.43s-.37-41.17-.48-46.52c-.11-6.11,2.71-72.53,2.71-72.53Z" style="fill:#37474f"></path><path d="M411,198.36l-2.9-16.07s-8-.7-12.48-5.18c0,0,.79,4.39,10.9,7l2.89,16.26-2.28,30.2Z" style="fill:#263238"></path></g><path d="M393.74,126.61c.86-6.28,1.69-14.72,11.42-15.11l12.56.6c3.09.81,15.11,2.23,15.11,2.23l.23,27.24s.76,19.64.53,30.15c-9,5.7-28.55,7.55-40.84-1.78C392.38,161.27,392.88,132.83,393.74,126.61Z" style="fill:#fafafa"></path><path d="M395.35,79.19a12.43,12.43,0,0,0,5.5,17.37l-2.26,1.56,22.58,2-.29,5.44a4.06,4.06,0,0,0,2.41-1.82c.81-1.45,3-10.35,3-10.35,2.12-4.86,3.16-9.86,1.64-11.52a4.24,4.24,0,0,0-2.25-1.3l3-1.51a2.41,2.41,0,0,0-3.27-1.19,2.48,2.48,0,0,0-.68.51,6.31,6.31,0,0,0,.15-1,4.44,4.44,0,0,0-.67-2.83,5.3,5.3,0,0,0-1.59-1.39c-2.54-1.59-5.55-2.18-8.38-3.18-1.6-.57-3.15-1.27-4.73-1.91a6,6,0,0,0-3.32-.6A2.2,2.2,0,0,0,404.38,70a4.26,4.26,0,0,0-4.66-.71,3.71,3.71,0,0,0-2.28,3.68,4.59,4.59,0,0,0-3.06.3,2.64,2.64,0,0,0-1.49,2.54A6.07,6.07,0,0,0,395.35,79.19Z" style="fill:#37474f"></path><path d="M411.25,82.37c2.08-.25,4.14-.59,6.2-.91a.69.69,0,0,1,.55.07.56.56,0,0,1,.17.31c1.36,4,1.32,8.25,2.4,12.28.1.37.33,1,.77,1,.8.09,1.35-.62,1.69-1.24l.77-1.39a3.62,3.62,0,0,1,.57-.71c1-.89,3.83-2,5.16,1.06s-1.52,7.18-3.82,7.82c-4,1.11-4.49-1.44-4.49-1.44l-.76,14.2c-3.52,3.68-15.09,2.4-12.8-.8l.15-4.32a24.55,24.55,0,0,1-5.32.1c-2.88-.54-4.62-2.88-5.4-6-1.25-5.08-1.11-11.29-.13-19a10.58,10.58,0,0,1,.71-2.66C401.72,83,406.65,82.92,411.25,82.37Z" style="fill:#ffa8a7"></path><path d="M407.81,108.35s6.51-1.09,8.81-2.22a7.44,7.44,0,0,0,3.22-3,10.26,10.26,0,0,1-1.89,3.59c-1.72,2.06-10.19,3.34-10.19,3.34Z" style="fill:#f28f8f"></path><path d="M408.74,92.33a1.39,1.39,0,1,0,1.43-1.4A1.42,1.42,0,0,0,408.74,92.33Z" style="fill:#263238"></path><path d="M410.67,86.55l2.91,1.25a1.66,1.66,0,0,0-.85-2.13A1.55,1.55,0,0,0,410.67,86.55Z" style="fill:#263238"></path><path d="M410.42,99.88l-4.56,1.55a2.36,2.36,0,0,0,3,1.59A2.52,2.52,0,0,0,410.42,99.88Z" style="fill:#b16668"></path><path d="M408.87,103a2.45,2.45,0,0,0,1.58-1.74,2,2,0,0,0-2.86,1.79A2.24,2.24,0,0,0,408.87,103Z" style="fill:#f28f8f"></path><path d="M397.18,87.72l2.9-1.11a1.5,1.5,0,0,0-2-.88A1.59,1.59,0,0,0,397.18,87.72Z" style="fill:#263238"></path><path d="M398.2,92.33a1.4,1.4,0,1,0,1.44-1.41A1.43,1.43,0,0,0,398.2,92.33Z" style="fill:#263238"></path><path d="M405,91.9l-.21,7.68-4.28-1.24,4-6.5A1.15,1.15,0,0,1,405,91.9Z" style="fill:#f28f8f"></path><path d="M392.21,134.42c.33-7.95,1-15,3.92-18.71s4.55-4.44,11.57-4.33l0,.48a2.6,2.6,0,0,0-2,1.15,41.4,41.4,0,0,0-5.4,12c-2,7.73-2.39,25-2.5,34.29s0,16.79,0,16.79-4.7-1.1-6.15-3.45C391.65,172.64,391.87,142.38,392.21,134.42Z" style="fill:#F30235"></path><path d="M392.21,134.42c.33-7.95,1-15,3.92-18.71s4.55-4.44,11.57-4.33l0,.48a2.6,2.6,0,0,0-2,1.15,41.4,41.4,0,0,0-5.4,12c-2,7.73-2.39,25-2.5,34.29s0,16.79,0,16.79-4.7-1.1-6.15-3.45C391.65,172.64,391.87,142.38,392.21,134.42Z" style="opacity:0.35000000000000003"></path><path d="M416.48,121.76c1-4.24,3.07-7,4-9.19l8.78,1.24c3.23,1.49,7.43,5,7.12,8.6l-2.3,26.06.64,24.68c-5,7.79-20,6.35-20,6.35s-.43-11.1.05-32.54C415.07,134.94,415.21,127.16,416.48,121.76Z" style="fill:#F30235"></path><path d="M416.48,121.76c1-4.24,3.07-7,4-9.19l8.78,1.24c3.23,1.49,7.43,5,7.12,8.6l-2.3,26.06.64,24.68c-5,7.79-20,6.35-20,6.35s-.43-11.1.05-32.54C415.07,134.94,415.21,127.16,416.48,121.76Z" style="opacity:0.35000000000000003"></path><path d="M416.07,123.85c.58-2.72.89-7.78,1.37-8.8s3.09-3,3.19-4.41l0-.89a4.42,4.42,0,0,1,2.2,1.13c.82.73,3.24,2.42,3.24,2.42a11.06,11.06,0,0,1-1.82,4.68c-1.44,2.07-3.44,3.42-3.75,2.91s-.26-1.29-.79-2.49c-.66-1.51-.82-2.15-1.52-.66C417.67,118.93,416.07,123.85,416.07,123.85Z" style="fill:#37474f"></path><path d="M401.1,122.36c-.71,2.3,1.16-7.94,2.38-9.74s4.32-2.51,4.32-2.51l-.13,2.21a3.35,3.35,0,0,0-2,1.38A37.49,37.49,0,0,0,401.1,122.36Z" style="fill:#37474f"></path><path d="M415.75,126a189.89,189.89,0,0,1,20,3.13l-.07.74a188.49,188.49,0,0,0-20.05-3.14C415.7,126.51,415.72,126.26,415.75,126Z" style="fill:#F30235"></path><path d="M392.83,125.86c2.19-.26,4.68-.49,7.41-.62l-.18.75c-2.7.13-5.16.36-7.31.62C392.77,126.36,392.8,126.1,392.83,125.86Z" style="fill:#F30235"></path><path d="M452.76,148.94c-9.38-23.82-11.43-31.23-18.05-34a17.8,17.8,0,0,0-5.45-1.16c-1.63,3-4,14.52,3.82,22.54,0,0,5.68,14,8.54,20.62-.09,6.66.39,12.21-1.64,21.21a6,6,0,0,1-2.26,3c-2.38,1.31-2.78,2.79-4.54,4.48-1.37,1.32-2.57,1.63-2.37,2.07a2.58,2.58,0,0,0,3,1.06,22.32,22.32,0,0,0,3.69-1.93c.23.27-2,3.82-4.31,6.41-3.43,3.81-4.26,6.56,2.59,6.83,4.29.17,8.92-3.35,11.83-11.9.57-1.69,1.17-4.13,1.78-6.51.44-1,3.58-17.06,4.24-22C454.51,153.56,454.29,152.81,452.76,148.94Z" style="fill:#ffa8a7"></path><path d="M428.09,113.81a13.6,13.6,0,0,1,8.31,1.46c3.71,2.24,5,4.2,9.47,14.62s5.35,12.43,5.35,12.43-2,5.94-13.94,6.62l-5.35-12.2s-4.44-5.53-4.85-12.36S428.09,113.81,428.09,113.81Z" style="fill:#F30235"></path><path d="M428.09,113.81a13.6,13.6,0,0,1,8.31,1.46c3.71,2.24,5,4.2,9.47,14.62s5.35,12.43,5.35,12.43-2,5.94-13.94,6.62l-5.35-12.2s-4.44-5.53-4.85-12.36S428.09,113.81,428.09,113.81Z" style="opacity:0.45"></path></g></g></svg>
             </div>
              <div class="flex justify-center items-center">
   <span class="p-[50px] text-zinc-400 font-semibold">سبد شما خالی می باشد</span>
</div>
              `
}
///////////////////////////////////////////////////// ButtonsManager
class ButtonsManagerCart {
  static UpdateCard = function (productId, cartId, count, allowQnty) {
    let cartItemquantity = document.getElementById(`quantity-${cartId}`)
    let plusBtn = document.getElementById(`plus-button-${cartId}`)

    let AllowQuantities = allowQnty.length
    cartItemquantity.innerHTML = count
    let productCount = count

    if (productCount < 1) {
    } else if (productCount >= 1) {
      if (AllowQuantities === parseInt(cartItemquantity.innerHTML)) {
        plusBtn.disabled = true
        let svgDisable = document.querySelectorAll(
          `#cart-counterbox-${cartId} button svg`
        )
        svgDisable[0].classList.add('disableSvgCartBtn')
        // svgDisable[1].classList.add('disableSvgCartBtn')
      }
      document
        .getElementById(`cartProductBox-${cartId}`)
        .classList.remove('inVisibleElement')
      this.addToCardPlus(cartId, count)
    }
  }

  static addToCardPlus = function (cartId, count) {
    let btnId = document.getElementById(`change-state-button-${cartId}`)
    let btnAttribureId = btnId.getAttribute('id')
    let counterBox = count
    if (counterBox === 1) {
      document.getElementById(btnAttribureId).innerHTML =
        '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"></path><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"></path></svg>'
    } else if (counterBox > 1) {
      document.getElementById(btnAttribureId).innerHTML =
        '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M872 474H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h720c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z"></path></svg>'
    }
  }
}

function closeCartSideNav() {
  document.querySelector('html').classList.remove('remove-scrolling')
  document.getElementById('cartSideNav').classList.remove('cartNavbarActive')
  document.getElementById('backdrop-cart').style.display = 'none'
}

function openCartSideNav() {
  // CartManagerRedux.getShoppingCartData()
  document.getElementById('cartSideNav').classList.add('cartNavbarActive')
  document.getElementById('backdrop-cart').style.display = 'block'
  document.querySelector('html').classList.add('remove-scrolling')
}
