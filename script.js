"use strict";

const TICKETS_SECTION = document.querySelector("[data-item='tickets-section']");
const FILTER_OPTIONS = document.querySelectorAll("[data-item='filter-option']");
const SORT_OPTIONS = document.querySelectorAll("[data-item='sort-option']");
const FILTER_OPTION_ALL = -1;

window.onload = async function () {
  try {
    const ticketsModule = await import("./test-response.js"); // "./test-response.js" заменить на: "./get-tickets.js"
    const tickets = await ticketsModule.getTickets();
    console.log(tickets);

    const filters = getFilters();
    let filteredTickets = getFilteredTickets(tickets, ...filters);
    renderSortedTickets(filteredTickets);

    // отрисовываем билеты после изменения фильтров
    FILTER_OPTIONS.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        const filters = getFilters();
        filteredTickets = getFilteredTickets(tickets, ...filters);
        renderSortedTickets(filteredTickets);
      });
    });

    // отрисовываем билеты после изменения сортировки
    SORT_OPTIONS.forEach((radio) => {
      radio.addEventListener("change", () => {
        renderSortedTickets(filteredTickets);
      });
    });
    
  } catch (error) {
    console.log(error.message);
  }
};

//перерисовка билетов
function renderSortedTickets(filteredTickets) {
  const sortValue = getSortValue();
  const sortedTickets = sortTickets(filteredTickets, sortValue);
  clearTickets();
  renderTickets(sortedTickets);
}

// отрисовываем массив билетов
function renderTickets(ticketsArray) {
  ticketsArray.forEach((element) => {
    renderOneTicket(element);
  });
}

// отрисовываем один билет, ticketData - объект билета
function renderOneTicket(ticketData) {
  const ticketTemplate = document.querySelector("[data-item='ticket-template']").content; // получаем template
  const ticket = ticketTemplate.cloneNode(true); // создаем новый экзепляр template
  const ticketPrice = ticket.querySelector("[data-item='ticket-price']");
  const ticketLogo = ticket.querySelector("[data-item='carrier-logo']");

  ticketPrice.innerHTML = new Intl.NumberFormat("ru-RU", {
    //используем объект Intl для форматирования с учетом локали
    style: "currency",
    currency: "RUB",
    currencyDisplay: "symbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(ticketData.price);

  ticketLogo.src = `//pics.avs.io/99/36/${ticketData.carrier}.png`; // получаем logo.png авиакомпании из CDN

  // формируем и заполняем маршруты билета
  ticketData.segments.forEach((element) => {
    const routeTemplate = ticket.querySelector("[data-item='route-template']").content;
    const ticketRoute = routeTemplate.cloneNode(true);
    const routeTitle = ticketRoute.querySelector("[data-item='route-title']");
    const routeTime = ticketRoute.querySelector("[data-item='route-time']");
    const routeLenght = ticketRoute.querySelector("[data-item='route-lenght']");
    const routeSstopsCount = ticketRoute.querySelector("[data-item='route-stops-count']");
    const routeStops = ticketRoute.querySelector("[data-item='route-stops']");

    let routeDuration = {};
    routeDuration.mins = element.duration % 60;
    routeDuration.hours = (element.duration - routeDuration.mins) / 60;

    // получаем дату и времы вылета из строки и вычисляем время прилета использую продолжительность полета (без учета часовых поясов)
    let timeFormatOptions = { hour: "numeric", minute: "numeric" };
    let departureDate = new Date(element.date);
    let departureTime = departureDate.toLocaleTimeString(
      "ru-RU",
      timeFormatOptions
    );
    let arrivalDate = new Date(departureDate);
    arrivalDate.setMinutes(arrivalDate.getMinutes() + element.duration);
    let arrivalTime = arrivalDate.toLocaleTimeString(
      "ru-RU",
      timeFormatOptions
    );

    // заполняем маршрут
    routeTitle.textContent = `${element.origin} – ${element.destination}`;
    routeTime.textContent = `${departureTime} – ${arrivalTime}`;
    routeLenght.textContent = `${routeDuration.hours}ч ${routeDuration.mins}м`;
    routeSstopsCount.textContent = defineQuantityStops(element.stops.length);
    routeStops.textContent = element.stops.join(", ");

    ticket.children[0].append(ticketRoute); // добавляем в потомка DocumentFragment HTMLCollection
  });

  TICKETS_SECTION.append(ticket); // добавляем заполненный экзепляр template в документ
}

// склоняем пересадку
function defineQuantityStops(number) {
  const words = ["пересадка", "пересадки", "пересадок"];
  if (number === 0) {
    return "без пересадок";
  }
  return `${number} ${getNoun(number, ...words)}`;
}

function getNoun(number, one, two, five) {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) {
    return five;
  }
  n %= 10;
  if (n === 1) {
    return one;
  }
  if (n >= 2 && n <= 4) {
    return two;
  }
  return five;
}

//удаляем все билеты
function clearTickets() {
  while (TICKETS_SECTION.children.length > 1) {
    TICKETS_SECTION.lastElementChild.remove();
  }
}

// выбираем билеты по количеству пересадок
function getFilteredTickets(ticketsArray, ...filters) {
  if (filters.includes(FILTER_OPTION_ALL)) {
    return ticketsArray; //если выбран фильтр "все" - возвращаем весь массив билетов
  }
  const result = ticketsArray.filter((ticket) => {
    return filters.some((filter) => {
      return (
        ticket.segments.every((segment) => segment.stops.length <= filter) &&
        ticket.segments.some((segment) => segment.stops.length == filter)
      );
    });
  });
  return result;
}

//получаем массив фильтров из чекбоксов
function getFilters() {
  let result = Array.from(FILTER_OPTIONS).filter(
    (checkbox) => checkbox.checked
  );
  return result.map((checkbox) => Number(checkbox.value));
}

//получаем значение для сортировки билетов
function getSortValue() {
  for (let radio of SORT_OPTIONS) {
    if (radio.checked) {
      return radio.value;
    }
  }
}

// сортировка массива билетов
function sortTickets(ticketsArray, sortValue) {
  const sortedTickets = [...ticketsArray];
  if (sortValue == "cheapest") {
    return sortedTickets.sort((a, b) => a.price - b.price);
  } else {
    return sortedTickets.sort((a, b) => {
      let aSumDuration = a.segments.reduce(
        (sumDuration, segment) => sumDuration + segment.duration,
        0
      );
      let bSumDuration = b.segments.reduce(
        (sumDuration, segment) => sumDuration + segment.duration,
        0
      );
      return aSumDuration - bSumDuration; //сравниваем суммарные значения duration из каждого билета
    });
  }
}
