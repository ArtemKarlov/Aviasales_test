"use strict";

//
// Response: {tickets: [], stop: true}
//
// interface Ticket {
//   // Цена в рублях
//   price: number
//   // Код авиакомпании (iata)
//   carrier: string
//   // Массив перелётов.
//   // В тестовом задании это всегда поиск "туда-обратно" значит состоит из двух элементов
//   segments: [
//     {
//       // Код города (iata)
//       origin: string
//       // Код города (iata)
//       destination: string
//       // Дата и время вылета туда
//       date: string
//       // Массив кодов (iata) городов с пересадками
//       stops: string[]
//       // Общее время перелёта в минутах
//       duration: number
//     },
//     {
//       // Код города (iata)
//       origin: string
//       // Код города (iata)
//       destination: string
//       // Дата и время вылета обратно
//       date: string
//       // Массив кодов (iata) городов с пересадками
//       stops: string[]
//       // Общее время перелёта в минутах
//       duration: number
//     }
//   ]
// }
// P.S.: Картинки авиакомпаний можешь брать с нашего 
//  CDN: //pics.avs.io/99/36/{IATA_CODE_HERE}.png
//

const url = "https://front-test.beta.aviasales.ru";

window.onload = async function () {
  try {
    let searchId = await getSearchId(url);
    let tickets = await search(url, searchId);
    console.log(tickets);
  } catch (error) {
    console.log(error.message);
  }
};

async function getSearchId(url) {
  let searchUrl = new URL("search", url);
  let response = await fetch(searchUrl);
  if (response.ok) {
    let json = await response.json();
    return json;
  } else {
    throw new Error(json.error);
  }
}

async function getTickets(url, params) {
  let ticketsUrl = new URL("tickets", url);
  ticketsUrl.searchParams.append("searchId", params.searchId);
  let response = await fetch(ticketsUrl);
  if (response.ok) {
    let json = await response.json();
    return json;
  } else {
    console.log("getTickets error");
    // throw new Error(json.error);
  }
}

async function search(url, searchId) {
  const response = await getTickets(url, searchId);
  const tickets = [];
  tickets.push(...response.tickets);
  if (!response.stop) {
    const response = await search(url, searchId);
    tickets.push(...response.tickets);
  }

  return tickets;
}

function renderTicket(ticket) {
  const logoUrl = `//pics.avs.io/99/36/${ticket.carrier}.png`
  const flight = ticket.segments[0];
  const returnFlite = ticket.segments[1];

 return `<article class="tickets__item ticket">
  <header class="ticket__header">
    <span class="ticket__price">${ticket.price}&nbsp;&#8381;</span>
    <img src="${logoUrl}" alt="S7 Logo" class="ticket__logo" />
  </header>
  <div class="ticket__details ticket-route">
    <div class="ticket-route__details">
      <p class="ticket-route__label route-title">${flight.origin} – ${flight.destination}</p>
      <p class="ticket-route__value route-time">${flight.date}</p>
    </div>
    <div class="ticket-route__details">
      <p class="ticket-route__label">В пути</p>
      <p class="ticket-route__value route-lenght">${flight.duration} м</p>
    </div>
    <div class="ticket-route__details">
      <p class="ticket-route__label route-stops-count">${flight.stops.lenght} пересадки</p>
      <p class="ticket-route__value route-stops">${flight.stops.join(', ')}</p>
    </div>
  </div>
  <div class="ticket__details ticket-route">
    <div class="ticket-route__details">
      <p class="ticket-route__label route-title">${returnFlite.origin} – ${returnFlite.destination}</p>
      <p class="ticket-route__value route-time">${returnFlite.date}</p>
    </div>
    <div class="ticket-route__details">
      <p class="ticket-route__label">В пути</p>
      <p class="ticket-route__value route-lenght">${returnFlite.duration} м</p>
    </div>
    <div class="ticket-route__details">
      <p class="ticket-route__label route-stops-count">${returnFlite.stops.lenght} пересадки</p>
      <p class="ticket-route__value route-stops">${returnFlite.stops.join(', ')}</p>
    </div>
  </div>
</article>`
}
