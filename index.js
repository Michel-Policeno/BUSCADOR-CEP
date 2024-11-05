const puppeteer = require("puppeteer");

//variaveis globais
const url = "https://www.google.com.br/";
const xpathBarSearchGoogle = '//*[@id="APjFqb"]';
const selectorAddressGoogle =
  "#rso > div:nth-child(1) > div > div > div > div > div:nth-child(2) > div > div:nth-child(2) > b > div > div > div";
const selectorCEPGoogle =
  "#rso > div.ULSxyf > div > div > div > div > div:nth-child(2) > div > div:nth-child(2) > b > div > div > span";

const addressList = [
  "PROFESSOR JOAQUIM CARDOSO DE MATOS, 745",
  "ALEXANDRE FLEMING, 84",
  "MARIO COVAS JUNIOR, 190",
];

//funções globais

//acessa o site
async function goToWebsite(pageWebsite, urlWebsite) {
  await pageWebsite.goto(urlWebsite);
}

//captura texto do endereço e Cep e imprimi resultados
async function captureCEP(pageCapture, selectorAddress, selectorCEP) {
  // texto do endereço
  const elementAddressGoogle = await pageCapture.evaluate((selectorAddress) => {
    return [...document.querySelectorAll(selectorAddress)].map((andress) => {
      const andressFind = andress.textContent.split("|")[0].trim();
      return `${andressFind}`;
    });
  }, selectorAddress);

  // texto do Cep
  const CEPGoogle = await pageCapture.evaluate((selectorCEP) => {
    return [...document.querySelectorAll(selectorCEP)].map((cep) => {
      const CEP = cep.textContent.split("|")[0].trim();
      return `${CEP}`;
    });
  }, selectorCEP);

  //imprimi resultados
  console.log(`${elementAddressGoogle}*${CEPGoogle}`);
}

//verificar xpath or selector existente na página
async function checkLoadXpathOrSelector(XpathOrSelector, pageElementChecked) {
  //verificar se é xpaht caso a string comece por "/", caso contrario selector.
  XpathOrSelector[0] === "/"
    ? await pageElementChecked.waitForXPath(XpathOrSelector)
    : await pageElementChecked.waitForSelector(XpathOrSelector);
}

//digita o endereço currente na barra de pesquisa do google
async function writeAddressOnGoogle(
  pageSearch,
  searchBarGoogle,
  addressCurrent
) {
  const acessBarSeachGoogle = await pageSearch.$x(searchBarGoogle);
  await acessBarSeachGoogle[0].type(addressCurrent);

  //aguarda o carregamento da página
  const [response] = await Promise.all([
    pageSearch.waitForNavigation(),
    pageSearch.keyboard.press("Enter"), //botão que dispara o carregamento da pagina
  ]);
}

//Função principal
async function finderCEPGoogle(addresses) {
  //configurações puppeter
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  // configura o tempo para maximo de carregamento
  page.setDefaultTimeout(9000);

  for (let index = 0; index < addresses.length; index++) {
    const addressCurrent = addresses[index];

    //acessar o site
    await goToWebsite(page, url);

    //verificar se xpath barra do google foi carregada
    await checkLoadXpathOrSelector(xpathBarSearchGoogle, page).catch(
      (error) => {
        console.log("Xpath barra pesquisa do google não encontrado");
        browser.close();
      }
    );

    //busca endereço atual no google
    await writeAddressOnGoogle(page, xpathBarSearchGoogle, addressCurrent);

    //verifica se CEP foi encontrado
    const addressFoundVerification = await checkLoadXpathOrSelector(
      selectorCEPGoogle,
      page
    ).catch((error) => {
      return false;
    });

    //Verifica se o endereço foi encontrado atraves da variavel addressFoundVerification, depois captura e imprimi o endereço e cep encontrados
    addressFoundVerification === false
      ? console.log(`${addressCurrent}*Não encontrado`)
      : await captureCEP(page, selectorAddressGoogle, selectorCEPGoogle);
  }
  await browser.close();
}

finderCEPGoogle(addressList).catch((Error) => {
  console.log(Error);
});
