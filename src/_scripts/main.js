
'use strict';



ymaps.ready(init);

function init() {

	// Формирование формы подтверждения
	var	$submit = $('.submit'),
		$ver = $('.ver'),
		$overlay = $('.form__overlay'),
		$whence = $('#whence'),
		$where = $('#where'),
		$button_confirm = $('.ver__button-confirm'),
		$button_cancel = $('.ver__button-cancel'),
		temp_address_val,
		temp_house_val,
		temp_front_val,
		temp_full_address;

	$($submit).on('click', function() {
		if ($(this).hasClass('active')) {
			varFormConfirm();
		}
	});

	function varFormConfirm() {
		$('.ver__whence').children('.var__value').html(getTempAdress( $whence ));
		$('.ver__where').children('.var__value').html(getTempAdress( $where ));
		$('.ver__phone').children('.var__value').html($('#phone').val());
		$('.var__car').children('.var__value').html($('.car__choice.active').attr('data-name'));
		$('.var__price').children('.var__value').html('~ ' + priceTrip + ' руб.');
		$($overlay).addClass('active');
		$($ver).addClass('active');

		function getTempAdress( obj ) {
			temp_full_address = "";
			temp_address_val = $( obj ).children('.address__input-address').val().trim();
			temp_house_val = $( obj ).children('.address__input-house').val().trim();
			temp_front_val = $( obj ).children('.address__input-front').val().trim();
			temp_full_address = temp_address_val;
			if (temp_house_val.length != 0) {
				temp_full_address += ', дом ' + temp_house_val;
				if (temp_front_val.length != 0) {
					temp_full_address += ', парадная ' + temp_front_val;
				}
			}
			return temp_full_address;
		}
	}
	function hideOverlay( obj ) {
		$( obj ).on('click', function() {
			$($overlay).removeClass('active');
			$($ver).removeClass('active');
		})
	}

	hideOverlay( $button_cancel );
	hideOverlay( $overlay );




	// Конец - Формирование формы подтверждения




	// Формирование цены
		// Цена за 1 км
	var	price_for_km = 0.5,
		// Цена посадки
		price_car = 1.5,
		// Длинна маршрута
		lengthRoute = 0,
		// Время в пути
		timeRoute = 0;
	// Конец - Формирование цены


	// Телефон

		// Поле ввода телефонного номера
	var	$inputForMask = $('.person__phone'),
		// Валидность введенного номера
		phoveValid = false;

	// Применение маски к полю ввода телефона
	$($inputForMask).inputmask({
		mask : "+375(99) 999-99-99",
		// При полном вводе
		oncomplete : function() {
			phoveValid = true;
			if (checkForRouteEntry($routeAddressesInput)) {
				submitActive();
			}
		},
		// При не полном вводе
		onincomplete : function() {
			phoveValid= false;
			submitUnActive();
		},
		// При удалении из номера одного и более значений
		canClearPosition : function() {
			phoveValid= false;
			submitUnActive();
		}
	});
	// Конец - Телефон



		// Переменная содержащая форму ввода маршрута
	var	form,
		// Переменная содержащая экземпляр Якарты
		myMap,
		// Коллекция геообъектов.
		thisGeoObjectCollection,
		// Массив инпутов с адресами маршрута
		$routeAddressesInput = [],
		// Массив адресов маршрута getRouteAddresses()
		routeAddresses = [],
		// Массив всех поисковых подсказок inputValidation()
		suggestView = [],
		// Массив одной поисковой подсказки inputValidation()
		suggestViewArr = [],
		// Кнопка отправки формы (Заказ такси)
		$submit = $('.submit'),
		// Переменная формы
		form				= document.querySelector('#form'),
		// Данные маршрута
		// Адресс
		$routeAddressesInput	= $('.address__input-address'),
		// Дом
		$routeHouseInput	= $('.address__input-house'),
		// Переменная автозаполнения адресов
		$suggestViewAdressHint,
		// Активный маршрут
		activeRoute,
		// Переменные данных о маршруте растояние и время в пути
		$tripDistans = $('.trip__length'),
		$tripTime = $('.trip__time'),
		$tripPrice = $('.trip__price'),
		// Элементы выбора автомобиля
		$carChoice = $('.car__choice'),
		// Переменная выбранного автомобиля
		autoChoice = 'седан',
		// Кнопка показа меню комментирования и выбора доп. опций
		$moreButton = $('.more__url'),
		// Меню комментариев и тд.
		$moreMenu = $('.more__menu'),
		// Элементы доп. опции
		$moreOption = $('.more__option'),
		// Цена итоговая
		priceTrip;

	// При нажатии на кнопку омментариев и тд.
	$($moreButton).on('click', function() {
		$($moreMenu).toggleClass('active');
	});

	// При нажатии на выбор автомобиля
	$($carChoice).on('click', function() {
		if (!$(this).hasClass('active')) {
			$($carChoice).removeClass('active')
			$(this).addClass('active')
			autoChoice = $(this).attr('data-name')

			// От того какая машина выбрана формируется цена посадки
			if ( autoChoice == 'седан' ) {
				price_car -= .5;

			}
			else if ( autoChoice == 'минивен' ) {
				price_car += .5;
			}
		}
		// Если маршрут уже введен, происходит пересчет цены маршрута
		if (checkForRouteEntry($routeAddressesInput)) {
			tripData(lengthRoute, timeRoute);
		}
	});

	// При нажатии на доп. опции
	$($moreOption).on('click', function() {
		$(this).toggleClass('active');
		function checkPrice( obj, sign) {
			$( obj ) .attr('data-price', function(index, value) {
				if ( value != undefined ) {
					price_car += parseInt( value ) * parseInt(sign);
				}
			});
		}
		if ($(this).hasClass('active')) {
			checkPrice( this, '1');
			// Если маршрут уже введен, происходит пересчет цены маршрута
			if (checkForRouteEntry($routeAddressesInput)) {
				tripData(lengthRoute, timeRoute);
			}
		}
		else {
			checkPrice( this, '-1');
			// Если маршрут уже введен, происходит пересчет цены маршрута
			if (checkForRouteEntry($routeAddressesInput)) {
				tripData(lengthRoute, timeRoute);
			}
		}
	});


	// При вводе в строку адреса
	$($routeAddressesInput).on("input", function() {
		// Получаем в массив suggestView все поисковые подсказки
		inputValidation(this.value);
		// Если что-то введено в строку адреса
		if (this.value.length > 0) {
			// Удаляем все подсказки
			$(".hints__hint").remove();
			// Показываем меня подсказок и добавляем их
			$(this).parent(".address__address").parent(".address").find(".hints").show().append(function(index, value) {

				var result = "",			// Результат выводимый на экран(автозаполнение)
					suggestViewAdress,		// Результат записывающийся в value
					suggestViewAdressDesc,	// Подпись к suggestViewAdress(область, страна)
					dataAddress;			// Дата атрибут

				for (var i = 0; i < suggestView.length; i++) {
					// Обнуляем массив всех поисковых подсказок
					suggestViewArr.splice(0, suggestViewArr.length);
					// Разделяем всех поисковых подсказок по знаку ","
					suggestViewArr = suggestView[i].split(',');

					// Обнуляем подпись к suggestViewAdress(область, страна)
					suggestViewAdressDesc = "";

					// Перебираем все подсказки выданные на введенные данные
					for (var j = 0; j < suggestViewArr.length; j++) {
						// С помощью условных операторов наполняем переменные
						// suggestViewAdressDesc - подпись адреса (город, область, страна)
						// suggestViewAdress - основной адрес (улица)
						if(j == suggestViewArr.length - 1) {
							suggestViewAdressDesc += suggestViewArr[j];
						}
						else if (j != 0) {
							suggestViewAdressDesc += suggestViewArr[j] + ", " ;
						}
						else{
							suggestViewAdress = suggestViewArr[j];
						}
					}
					dataAddress = 'val:'+suggestViewAdress+';address:'+suggestView[i];
					result += '<li class="hints__hint" data-address="' + dataAddress + '">' + suggestViewAdress + '<br><span class= \"hints__hint-desc\">' + suggestViewAdressDesc + '.<span></li>';
				}
				return result;
			})
		//
		$suggestViewAdressHint = $(".hints__hint");
		$($suggestViewAdressHint).on('click', function(){
			var ObjAdressForInput = stringToObj(this);
			$(this)
					// Скрываем подсказки адресов и добавляем выбранный адрес в строку поиска
					.parent(".address__hints")
					.hide()
					.parent(".address")
					.find(".address__input-address")
					.val(ObjAdressForInput.val)
					.attr('data-address', ObjAdressForInput.address);

					if (checkForRouteEntry($routeAddressesInput)) {
						routeingInMap();
						if (phoveValid) {
							submitActive();
						}
					}
		})
		}
		// Если ничего не введено в строку адреса
		else {
			$(".hints__hint").remove();
		}
	});



	// При вводе номера дома прокладывается адрес
	$($routeHouseInput).on("input", function() {
		if (checkForRouteEntry($routeAddressesInput)) {
			routeingInMap();
			if (phoveValid) {
				submitActive();
			}
		}
	});

	// Проверка введения всего маршрута
	function checkForRouteEntry($inputs){
		for (var i = 0; i < $inputs.length; i++) {
			if($($inputs[i]).attr('data-address') == undefined) {
				return false;
			}
		}
		return true;
	}
	// Активация кнопки отправки формы (Заказать такси)
	function submitActive() {
		$($submit).addClass('active')
	}

	function submitUnActive() {
		$($submit).removeClass('active')
	}

	// Перевод строки в объект
	function stringToObj(obj) {
		var string = $(obj).attr('data-address');
		var arr = [],
			obj = [],
			arrSplit = [];

		arr = string.split(';');
		for (var i = 0; i < arr.length; i++) {
			arrSplit = arr[i].split(':');
			obj[arrSplit[0]] = arrSplit[1];
		}
		return obj;
	}

	// Функция добавления поисковых подсказок по value
	function inputValidation(value) {
		ymaps.suggest(value, {
			boundedBy:[[54.565521,30.309393],[54.454647, 30.502341]],
			provider: {
					suggest:(function(request, options){
					return ymaps.suggest("Беларусь, Витебская область, Орша," + request);
			})}
		}).then(function (items) {
			suggestView.splice(0, suggestView.length);
			for (var i = 0; i < items.length; i++) {
				suggestView[i]= items[i].displayName;
			}
		});
	};

	// Функция получения всех адресов введенных в инпуты поиска
	function getRouteAddresses() {
		var address = [];
		for (var i = 0; i < $routeAddressesInput.length; i++) {
			address[i]= $($routeAddressesInput[i]).val() + ", " + $($routeHouseInput[i]).val() + ", Орша, Витебская область, Беларусь";
			//address[i]= $($routeAddressesInput[i]).attr('data-address');
		}
		return address;
	};

	// Функция добавления маршрута на карту, она же удаляет предыдущее маршруты
	// с помощью функции myGeoObjects.removeAll()
	function showRoute(value, callback) {
		ymaps.route(value, {
			boundedBy:[[54.565521,30.309393],[54.454647, 30.502341]],
		}).then(
			function (route) {
				thisGeoObjectCollection.removeAll();
				thisGeoObjectCollection.add(route);
				myMap.geoObjects.add(thisGeoObjectCollection);
				var routeDataLength = (route.getLength()/1000).toFixed(2);
				var routeDataTime =  Math.ceil(route.getTime()/60);
				callback(routeDataLength, routeDataTime);
			},
			function (error) {
				alert('Возникла ошибка: ' + error.message);
			}
		);
	};

	// Отображение длинны и времени маршрута
	function tripData(length, time) {
		priceTrip = Math.ceil(price_for_km * length) + price_car;
		console.log(price_for_km*length, price_car);
/*		$($tripDistans).html('Растояние: ~ ' + length + ' км');
		$($tripTime).html('В пути: ~ ' + time + ' минут');*/
		$($tripPrice).html('стоимость ~ ' + priceTrip + ' руб.');
	};

	// Создаем экземпляр Якарты
	myMap = new ymaps.Map('YMapsID', {
		center: [54.510741, 30.429586],
		zoom: 15,
		controls: []
	});

	// Создаем коллекцию геообъектов(в данном случае маршрутов)
	// для более удобного редактирования в дальнейшем
	thisGeoObjectCollection = new ymaps.GeoObjectCollection({}, {
		preset: "islands#redCircleIcon",
		strokeWidth: 4,
		geodesic: true
	});
	// Сохранение данны маршрута
	function saveDataRoute(length, time) {
		// Длинна маршрута
		lengthRoute = length,
		// Время в пути
		timeRoute = time;
	}
	// Показ маршрута на карте
	function routeingInMap() {
		// Получаем адреса для маршрута
		routeAddresses = getRouteAddresses();

		// Отображаем маршрут на карте
		showRoute(routeAddresses, function(length, time) {
			tripData(length, time);
			saveDataRoute(length, time);
		});
	};
}