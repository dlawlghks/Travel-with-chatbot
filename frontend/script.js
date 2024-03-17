let userName;
let travelDestination;
let totalTravelCost = 0;

function isImageLink(url) {
    return url.includes('media-cdn.tripadvisor.com') || 
           url.includes('search.pstatic.net') || 
           url.includes('123rf.com') ||
           url.includes('bstatic.com');
}

function isNormalLink(url) {
    return url.includes('travel.naver.com') || url.includes('booking.com') || url.includes('flight.naver.com');
}

async function getTravel(message) {
    showLoadingIndicator(); // 로딩 인디케이터 표시

    try {
        const response = await fetch("http://localhost:3000/travelTell", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: message,
                name: userName,
                destination: travelDestination
            }),
        });
        const data = await response.json();
        //console.log(data); // 응답 데이터 확인
        const fullMessage = data.assistant;
        //console.log(fullMessage); // 전체 메시지 확인

        // 서버 응답을 채팅창에 추가
        addToChatbox(fullMessage, 'bot');

        // 모든 링크 찾기
        const linkRegex = /\[([^\]]+)\]\((http[^)]+)\)/g;
        let match;
        let imageLinks = [];
        let normalLinks = [];
        while ((match = linkRegex.exec(fullMessage)) !== null) {
            const url = match[2];
            if (isImageLink(url)) {
                imageLinks.push(url);
            }
            if (isNormalLink(url)) {
                normalLinks.push(url);
            }
        }

        if (imageLinks.length > 0 || normalLinks.length > 0) {
            createLinkButton(imageLinks, normalLinks);
        }
    } catch (error) {
        console.error("실패:", error);
        addToChatbox("오류가 발생했습니다. 다시 시도해주세요.", 'bot');
    } finally {
        hideLoadingIndicator(); // 로딩 인디케이터 숨김
    }
}

// 여행 예약 버튼 클릭 이벤트
function createLinkButton(imageLinks, normalLinks) {
    const chatbox = document.getElementById("chatbox");
    const button = document.createElement("button");
    button.textContent = "여행 추가하기";
    button.className = "link-button";
    button.onclick = function() {
        const day = prompt("몇 일차에 여행을 추가하시겠습니까?");
        if (day) {
            addTravelInfoToDay(day, imageLinks, normalLinks);
        }
    };
    chatbox.appendChild(button);
}

// 선택된 일차에 여행 정보를 추가하는 함수
let scheduleData = {};

function addTravelInfoToDay(day, imageLinks, normalLinks) {
    const startTime = prompt("여행 시작 시간을 입력하세요 (예: 09:00)");
    const endTime = prompt("여행 종료 시간을 입력하세요 (예: 18:00)");
    // 여행지 정보 입력
    const placeType = prompt("장소 유형을 입력하세요 (예: 여행지, 항공편, 식당)");
    // 장소 이름 입력
    const placeName = prompt("가는 장소의 이름을 입력하세요 (예: 이탈리아 레스토랑)");
    
    // 일정 데이터를 저장합니다.
    if (!scheduleData[day]) {
        scheduleData[day] = [];
    }
    scheduleData[day].push({ startTime, endTime, placeType, placeName, imageLinks, normalLinks });

    // DOM에 일정을 추가합니다.
    updateDOMForDay(day);
}
function updateDOMForDay(day) {
    const daySchedule = document.querySelector(`.day-schedule[data-day="${day}"]`);
    if (daySchedule) {
        const dayInfoText = daySchedule.querySelector('.day-info-text');
        scheduleData[day].forEach(item => {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'travel-info';
            infoDiv.style.display = 'flex';
            infoDiv.style.alignItems = 'center';

            let textInfoContent = `
                <div class="text-info" style="flex-grow: 1;"> 
                    <div class="time">${item.startTime}-${item.endTime}</div>
                    <div class="place-type">${item.placeType}</div>
                    <div class="place-name">${item.placeName}</div>`;
        
            item.normalLinks.forEach(link => {
                textInfoContent += `<div class="link-container"><a href="${link}" target="_blank">관련 링크</a></div>`;
            });

            textInfoContent += `</div>`; // 여기서 textInfoContent 끝

            let imageContent = '';
            item.imageLinks.forEach(imgLink => {
                imageContent += `<div class="image-container" style="flex-shrink: 0;"><img src="${imgLink}" alt="여행 이미지" style="width:100px; height:auto;"></div>`;
            });
    
            infoDiv.innerHTML = textInfoContent + imageContent; // imageContent를 추가
            daySchedule.appendChild(infoDiv);
        });

        // 추가된 정보를 지우지 않고 유지합니다.
        scheduleData[day] = [];
    }
    updateMapAndTravelInfoHeight(day);
}
function updateMapAndTravelInfoHeight(day) {
    const daySchedule = document.querySelector(`.day-schedule[data-day="${day}"]`);
    if (daySchedule) {
        // travel-info 요소와 map-container 요소에 대한 참조 가져오기
        const travelInfos = daySchedule.querySelectorAll('.travel-info');
        const mapContainer = daySchedule.querySelector('.map-container');

        if (travelInfos.length > 0 && mapContainer) {
            // travel-info 요소들 중 첫 번째 요소의 높이 가져오기
            const travelInfoHeight = travelInfos[0].offsetHeight;

            // map-container의 높이를 travel-info 요소의 높이와 동일하게 설정
            mapContainer.style.height = `${travelInfoHeight}px`;
        }
    }
}

// 일정 생성 시 각 일차에 data-day 속성 추가
function createSchedule(days) {
    const scheduleContainer = document.getElementById('scheduleContainer');
    scheduleContainer.innerHTML = ''; // 컨테이너 내용을 초기화합니다.

    for (let i = 1; i <= days; i++) {
        const daySchedule = document.createElement('div');
        daySchedule.className = 'day-schedule';
        daySchedule.setAttribute('data-day', i);
        
        // 기본 텍스트를 포함하는 요소를 생성합니다.
        const dayInfoText = document.createElement('div');
        dayInfoText.textContent = `${i}일차 여행 계획`;
        dayInfoText.className = 'day-info-text';
        
        // 기본 텍스트 요소를 첫 번째 자식 요소로 추가합니다.
        daySchedule.appendChild(dayInfoText);
        
        scheduleContainer.appendChild(daySchedule);
        
        // 해당 일차의 기존 여행 정보가 있으면 DOM을 업데이트합니다.
        if (scheduleData[i]) {
            updateDOMForDay(i);
        }
    }
}


function addToChatbox(message, sender) {
    const chatbox = document.getElementById("chatbox");
    const newMessage = document.createElement('div');

    // 링크와 이미지 링크를 제거
    let cleanedMessage = message.replace(/\[([^\]]+)\]\((http[^)]+)\)/g, '');
    cleanedMessage = cleanedMessage.replace(/!\[([^\]]+)\]\((http[^)]+)\)/g, '');

    newMessage.textContent = cleanedMessage;
    newMessage.className = 'message ' + (sender === 'user' ? 'user-message' : 'bot-message');
    chatbox.appendChild(newMessage);
    
    // 가격 정보가 있는 경우 경비 추가 버튼을 추가합니다.
    if (sender === 'bot') {
        const prices = extractPrice(message);
        prices.forEach(price => addCostButton(price));
    }

    chatbox.scrollTop = chatbox.scrollHeight;
}
function extractPrice(message) {
    const priceRegex = /(\d{1,3}(?:,\d{3})*원)/g; // 콤마를 포함한 숫자에 대한 정규 표현식 수정
    let match;
    let prices = [];

    while ((match = priceRegex.exec(message)) !== null) {
        let price = parseInt(match[1].replace(/,/g, ''), 10); // 콤마 제거 후 정수로 변환
        prices.push(price);
    }

    return prices;
}

function addCostButton(price) {
    const chatbox = document.getElementById("chatbox");
    const button = document.createElement("button");
    button.textContent = "경비 추가하기";
    button.className = "add-cost-button";
    button.onclick = function() {
        totalTravelCost -= price; // 경비를 빼는 로직으로 변경
        updateTotalCostDisplay();
    };
    chatbox.appendChild(button);
    chatbox.scrollTop = chatbox.scrollHeight;
}

function updateTotalCostDisplay() {
    const costDisplay = document.getElementById("totalCostDisplay");
    costDisplay.textContent = `총 예산: ${totalTravelCost.toLocaleString()}원`;
}

// 페이지 로딩 시 현재 추가된 경비를 표시하는 요소를 초기화합니다.
document.addEventListener('DOMContentLoaded', function() {
    let totalCostDisplay = document.getElementById("totalCostDisplay");
    if (!totalCostDisplay) {
        totalCostDisplay = document.createElement('div');
        totalCostDisplay.id = 'totalCostDisplay';
        document.querySelector('.input-area').appendChild(totalCostDisplay);
    }
    updateTotalCostDisplay();
    verifyLoadingIndicator(); // 로딩 인디케이터 검증
    let userInput = document.getElementById('userInput');
    userInput.addEventListener('keyup', function(event) {
        if (event.keyCode === 13) {
            event.preventDefault(); // 엔터키 기본 이벤트 방지
            sendMessage(); // 메시지 보내기 함수 호출
        }
    });
});

// 로딩 인디케이터 검증 및 초기화
function verifyLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (!loadingIndicator) {
        console.error('Loading indicator not found');
        return;
    }
    console.log('Loading indicator found', loadingIndicator);

    window.showLoadingIndicator = function() {
        loadingIndicator.style.display = 'flex';
    }

    window.hideLoadingIndicator = function() {
        loadingIndicator.style.display = 'none';
    }
}

function changeDestination() {
    document.querySelector('.chat-container').style.display = 'none';
    document.querySelector('.start-screen').style.display = 'block';
    document.getElementById('chatbox').innerHTML = ''; // 채팅 내역 초기화
}

function startChat() {
    userName = document.getElementById('userName').value;
    travelDestination = document.getElementById('travelDestination').value;
    let travelBudget = parseFloat(document.getElementById('travelBudget').value);
    let travelDuration = document.getElementById('travelDuration').value;
    totalTravelCost = isNaN(travelBudget) ? 0 : travelBudget;
    // 여행 경비를 화면에 표시합니다.
    updateTotalCostDisplay();

    // 상단 컨테이너에 여행 정보를 표시할 요소를 선택하거나 생성합니다.
    let tripInfoElement = document.querySelector('.trip-info');
    if (!tripInfoElement) {
        tripInfoElement = document.createElement('div');
        tripInfoElement.className = 'trip-info';
        document.querySelector('.top-container').appendChild(tripInfoElement);
    }

    // 사용자가 입력한 여행지와 기간을 텍스트로 설정합니다.
    tripInfoElement.textContent = `${travelDestination} ${travelDuration}`;
    document.querySelector('.top-container').style.display = 'block';
    if (userName && travelDestination && !isNaN(travelBudget) && travelDuration) {
        document.querySelector('.start-screen').style.display = 'none';
        const mainContainer = document.querySelector('.main-container');
        mainContainer.style.display = 'flex'; // 이 부분이 채팅창을 보여줍니다.

        // 여행 일정 문자열에서 숫자만 추출하여 일정 탭 생성
        const duration = document.getElementById('travelDuration').value;
        const days = duration.match(/\d+/g);
        const totalDays = parseInt(days[1], 10) + 1; // "일" 수 계산
    
        const durationMatch = travelDuration.match(/(\d+)박(\d+)일/);
        if (durationMatch) {
            const nights = parseInt(durationMatch[1], 10);
            const days = parseInt(durationMatch[2], 10);
            if (days === nights + 1) { // 박 수보다 하루 더 많은 일 수인 경우에만 탭 생성
                createMenu(days);
                createSchedule(days); // 전체 일정을 표시합니다.
            } else {
                alert('여행 일정 형식이 올바르지 않습니다. 예: "4박5일"');
            }
        } else {
            alert('여행 일정 형식이 올바르지 않습니다. 예: "4박5일"');
        }

        // 채팅창 내용 초기화 및 시작 메시지 출력
        const chatbox = document.getElementById('chatbox');
        chatbox.innerHTML = '';
        addToChatbox(`안녕하세요, ${userName}님! ${travelDestination} 여행을 위한 정보를 받았습니다.`, 'bot');
        addToChatbox(`여행 기간: ${travelDuration}`, 'bot');
        addToChatbox('무엇을 도와드릴까요?', 'bot');
    } else {
        alert('이름, 여행지역, 여행 경비, 여행 기간을 모두 입력해주세요!');
    }
}

function createMenu(days) {
    const menuBar = document.getElementById('menuBar');
    menuBar.innerHTML = ''; // 메뉴바 초기화

    // "전체일정" 탭 추가
    const allScheduleTab = createTab('전체일정');
    allScheduleTab.addEventListener('click', showAllSchedule); // 전체 일정을 보여주는 함수와 연결
    menuBar.appendChild(allScheduleTab);

    // 일수만큼 일정 탭 추가
    for (let i = 1; i <= days; i++) {
        const dayTab = createTab(i + '일차');
        dayTab.addEventListener('click', function() {
            showDailySchedule(i); // 해당 일차의 일정을 보여주는 함수와 연결
        });
        menuBar.appendChild(dayTab);
    }
}

function createTab(text, isActive = false) {
    const tab = document.createElement('button');
    tab.textContent = text;
    tab.classList.add('menu-item');
    if (isActive) tab.classList.add('active');
    
    // 탭 클릭 이벤트 추가
    tab.onclick = function() {
        // 모든 탭의 'active' 클래스 제거
        const tabs = document.querySelectorAll('.menu-item');
        tabs.forEach(t => t.classList.remove('active'));
        
        // 현재 탭에 'active' 클래스 추가
        tab.classList.add('active');
        // '전체일정' 탭이 아닌 경우에만 스타일 변경
        if (text == '전체일정') {
            const dayInfoTexts = document.querySelectorAll('.day-info-text');
            dayInfoTexts.forEach(element => {
                element.style.justifyContent = 'space-around'; // 스타일 변경 예시
                // 여기에 필요한 스타일 변경을 추가
            });
        }
        else {
            const dayInfoTexts = document.querySelectorAll('.day-info-text');
            dayInfoTexts.forEach(element => {
                element.style.justifyContent = 'flex-start'; // 스타일 변경 예시
                // 여기에 필요한 스타일 변경을 추가
            });
        }
        // 여기에 탭에 해당하는 일정을 표시하는 로직을 추가
        if (text.includes('일차')) {
            const dayNumber = parseInt(text.replace('일차', ''), 10);
            showDailySchedule(dayNumber);
        } else {
            showAllSchedule();
        }
    };
    return tab;
}
const apiKey = 'AIzaSyCo3FbB9a0s3B2NxNVK00boLXy_h7313nk';  // 여기에 자신의 Google Maps API 키를 입력하세요.
const markers = [];
let map;       
let polyline;
const maps = {};

function initMap(dayIndex) {
    const mapId = 'map-' + dayIndex;
    const mapElement = document.getElementById(mapId);
    if (mapElement) {
        maps[dayIndex] = new google.maps.Map(mapElement, {
            center: { lat: 0, lng: 0 },
            zoom: 2
        });
    polyline = new google.maps.Polyline({
        map: map,
        path: [],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
}
}
function addMarker(location, order) {
    const marker = new google.maps.Marker({
        position: location.geometry.location,
        map: map,
        title: location.formatted_address,
        label: order.toString(),  // 마커에 순서를 표시
        icon: getMarkerIcon(order),
    });

    markers.push(marker);

    const infowindow = new google.maps.InfoWindow({
        content: location.formatted_address
    });

    marker.addListener('click', function() {
        infowindow.open(map, marker);
    });

    updatePolyline();
}

function updatePolyline() {
    const path = markers.map(marker => marker.getPosition());
    polyline.setPath(path);
}

function updateMarker(newLocation, order, dayIndex) {
    const map = maps[dayIndex];
    if (!map) return;
    addMarker(newLocation, order);

    // 모든 마커에 대한 경계를 계산하여 지도를 조정
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => {
        bounds.extend(marker.getPosition());
    });
    map.fitBounds(bounds);

    // Directions API를 사용하여 마커 간의 대중교통 경로 및 소요 시간을 가져옴
    if (markers.length > 1) {
        const directionsService = new google.maps.DirectionsService();
        const directionsDisplay = new google.maps.DirectionsRenderer();
        directionsDisplay.setMap(map);

        const origin = markers[markers.length - 2].getPosition();
        const destination = markers[markers.length - 1].getPosition();

        const request = {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.TRANSIT
        };

        directionsService.route(request, function(response, status) {
            if (status === 'OK') {
                directionsDisplay.setDirections(response);
            } else {
                alert('대중교통 경로를 찾을 수 없습니다.');
            }
        });
    }
}

function getMarkerIcon(order) {
    // Customize marker colors to pastel tones
    const colors = ['#FFC3A0', '#FFAFBD', '#FFC3A0', '#FFD8B1', '#C1E1C1', '#B2C8FF'];
    const colorIndex = order % colors.length;
    return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: colors[colorIndex],
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 10,
        label: order.toString(),
    };
}

window.updateMap = function (dayIndex) {
    const locationInputId = 'locationInput-' + dayIndex;
    const locationInput = document.getElementById(locationInputId).value;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: locationInput, region: 'kr' }, (results, status) => {
        if (status === 'OK' && results[0]) {
            const newLocation = results[0];
            updateMarker(newLocation, markers.length + 1, dayIndex);
        } else {
            alert('장소를 찾을 수 없습니다.');
        }
    });
};
function loadScript() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&language=en&libraries=places`;
    script.defer = true;
    script.async = true;
    document.head.appendChild(script);
}
function showDailySchedule(dayIndex) {
    const allDaySchedules = document.querySelectorAll('.day-schedule');
    allDaySchedules.forEach(daySchedule => {
        daySchedule.style.display = 'none';
    });

    const selectedDaySchedule = document.querySelector(`.day-schedule[data-day="${dayIndex}"]`);
    if (selectedDaySchedule) {
        selectedDaySchedule.style.display = 'block';
        scheduleContainer.style.marginLeft = '30px'; // 메뉴 바 너비만큼 왼쪽 여백 추가
        scheduleContainer.style.justifyContent = 'flex-start';

        // 위치 입력 및 마커 표시 버튼 표시
        const locationInputContainer = document.getElementById('locationInputContainer');
        if (locationInputContainer) {
            locationInputContainer.style.display = 'block';
        }

        // 각 일차에 맞는 지도 추가 및 초기화
        addMapInputFields(selectedDaySchedule, dayIndex);
    }

    // 지도 컨테이너가 있는 경우, 지도 크기 조정
    const mapContainer = document.getElementById(`map-container-${dayIndex}`);
    if (mapContainer) {
        mapContainer.style.display = 'block';
        google.maps.event.trigger(maps[dayIndex], 'resize');
    }
    const locationInputContainer = document.getElementById(`locationInputContainer-${dayIndex}`);
    if (locationInputContainer) {
        locationInputContainer.style.display = 'flex';
        locationInputContainer.style.marginLeft = 'auto';
    }
}

function showAllSchedule() {
    const allDaySchedules = document.querySelectorAll('.day-schedule');
    allDaySchedules.forEach(daySchedule => {
        daySchedule.style.display = 'block';
        scheduleContainer.style.justifyContent = 'space-around';
    });

    // 위치 입력 및 마커 표시 버튼 숨기기
    const locationInputContainer = document.getElementById('locationInputContainer');
    if (locationInputContainer) {
        locationInputContainer.style.display = 'none';
    }

    // 모든 지도 컨테이너 숨기기
    const mapContainers = document.querySelectorAll('[id^="map-container-"]');
    mapContainers.forEach(mapContainer => {
        mapContainer.style.display = 'none';
    });
    const locationInputContainers = document.querySelectorAll('.location-input-container');
    locationInputContainers.forEach(container => {
        container.style.display = 'none';
    });
}




function addMapInputFields(daySchedule, dayIndex) {
    const mapContainerId = 'map-container-' + dayIndex;
    const mapElementId = 'map-' + dayIndex;
    const locationInputContainerId = 'locationInputContainer-' + dayIndex;

    if (!daySchedule.querySelector(`#${mapContainerId}`)) {
        const mapInputHTML = `
        <div id="${locationInputContainerId}" class="location-input-container"">
            <label for="locationInput-${dayIndex}">위치 입력:</label>
            <input type="text" id="locationInput-${dayIndex}" placeholder="예: 서울, 부산, Tokyo">
            <button onclick="updateMap(${dayIndex})">마커 표시</button>
        </div>
        <div id="${mapContainerId}">
            <div id="${mapElementId}" style="width: 800px; height: 600px; border-radius: 10px; margin-left: auto; position: absolute; bottom: 180px; right: 520px;"></div>
        </div>
        `;
        daySchedule.insertAdjacentHTML('beforeend', mapInputHTML);

        // 지도 초기화
        initMap(dayIndex);
    }
}
function adjustMapContainerHeight() {
    const daySchedules = document.querySelectorAll('.day-schedule');
    daySchedules.forEach(daySchedule => {
        const travelInfo = daySchedule.querySelector('.travel-info');
        const mapContainer = daySchedule.querySelector('.map-container');
        if (travelInfo && mapContainer) {
            mapContainer.style.height = `${travelInfo.offsetHeight}px`;
        }
    });
}


// 페이지 로딩 시 지도 초기화 함수 호출
window.onload = function() {
    loadScript();
    // 기타 필요한 초기화 코드
    adjustMapContainerHeight();
}




function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    if (userInput) {
        addToChatbox(userInput, 'user');
        getTravel(userInput); // 이 부분을 추가
        document.getElementById('userInput').value = ''; // 입력 필드 초기화
    }
}