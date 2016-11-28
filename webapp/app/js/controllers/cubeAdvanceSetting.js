/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

'use strict';

KylinApp.controller('CubeAdvanceSettingCtrl', function ($scope, $modal,cubeConfig,MetaModel,cubesManager,CubeDescModel,SweetAlert) {
  $scope.cubesManager = cubesManager;
  $scope.getTypeVersion=function(typename){
    var searchResult=/\[v(\d+)\]/.exec(typename);
    if(searchResult&&searchResult.length){
      return searchResult.length&&searchResult[1]||1;
    }else{
      return 1;
    }
  }
  $scope.removeVersion=function(typename){
    if(typename){
      return typename.replace(/\[v\d+\]/g,"");
    }
    return "";
  }
  var needLengthKeyList=['fixed_length','fixed_length_hex','int','integer'];
  //rowkey
  $scope.convertedRowkeys = [];
  angular.forEach($scope.cubeMetaFrame.rowkey.rowkey_columns,function(item){
    //var _isDictionaries = item.encoding === "dict"?"true":"false";
    //var version=$scope.getTypeVersion(encoding);
    item.encoding=$scope.removeVersion(item.encoding);
    //var _isFixedLength = item.encoding.substring(0,12) === "fixed_length"?"true":"false";//fixed_length:12
    //var _isIntegerLength = item.encoding.substring(0,7) === "integer"?"true":"false";
    //var _isIntLength = item.encoding.substring(0,3) === "int"?"true":"false";
    var _encoding = item.encoding;
    var _valueLength ;
    var baseKey=item.encoding.replace(/:\d+/,'');
    if(needLengthKeyList.indexOf(baseKey)>=-1){
      var result=/:(\d+)/.exec(item.encoding);
      _valueLength=result?result[1]:0;
    }
    _encoding=baseKey;
    var rowkeyObj = {
      column:item.column,
      encoding:_encoding+(item.encoding_version?"[v"+item.encoding_version+"]":"[v1]"),
      valueLength:_valueLength,
      isShardBy:item.isShardBy,
      encoding_version:item.encoding_version||1
    }
    $scope.convertedRowkeys.push(rowkeyObj);

  })


  $scope.rule={
    shardColumnAvailable:true
  }
  var checkedlen=$scope.cubeMetaFrame.rowkey.rowkey_columns&&$scope.cubeMetaFrame.rowkey.rowkey_columns.length||0;
  for(var i=0;i<checkedlen;i++){
    $scope.cubeMetaFrame.rowkey.rowkey_columns[i].encoding_version=$scope.cubeMetaFrame.rowkey.rowkey_columns[i].encoding_version||1;
  }
  $scope.refreshRowKey = function(list,index,item,checkShard){
    var encoding;
    var column = item.column;
    var isShardBy = item.isShardBy;
    var version=$scope.getTypeVersion(item.encoding);
    var encodingType=$scope.removeVersion(item.encoding);

    if(needLengthKeyList.indexOf(encodingType)>=-1){
      encoding = encodingType+":"+item.valueLength;
    }else{
      encoding = encodingType;
      item.valueLength=0;
    }
    $scope.cubeMetaFrame.rowkey.rowkey_columns[index].column = column;
    $scope.cubeMetaFrame.rowkey.rowkey_columns[index].encoding = encoding;
    $scope.cubeMetaFrame.rowkey.rowkey_columns[index].encoding_version =version;
    $scope.cubeMetaFrame.rowkey.rowkey_columns[index].isShardBy = isShardBy;
    if(checkShard == true){
      $scope.checkShardByColumn();
    }
  }

  $scope.checkShardByColumn = function(){
    var shardRowkeyList = [];
    angular.forEach($scope.cubeMetaFrame.rowkey.rowkey_columns,function(rowkey){
      if(rowkey.isShardBy == true){
        shardRowkeyList.push(rowkey.column);
      }
    })
    if(shardRowkeyList.length >1){
      $scope.rule.shardColumnAvailable = false;
    }else{
      $scope.rule.shardColumnAvailable = true;
    }
  }


  $scope.resortRowkey = function(){
    for(var i=0;i<$scope.convertedRowkeys.length;i++){
      $scope.refreshRowKey($scope.convertedRowkeys,i,$scope.convertedRowkeys[i]);
    }
  }

  $scope.removeRowkey = function(arr,index,item){
    if (index > -1) {
      arr.splice(index, 1);
    }
    $scope.cubeMetaFrame.rowkey.rowkey_columns.splice(index,1);
  }


  $scope.addNewRowkeyColumn = function () {
    var rowkeyObj = {
      column:"",
      encoding:"dict",
      valueLength:0,
      isShardBy:"false"
    }

    $scope.convertedRowkeys.push(rowkeyObj);
    $scope.cubeMetaFrame.rowkey.rowkey_columns.push({
      column:'',
      encoding:'dict',
      isShardBy:'false'
    });

  };

  $scope.addNewHierarchy = function(grp){
    grp.select_rule.hierarchy_dims.push([]);
  }

  $scope.addNewJoint = function(grp){
    grp.select_rule.joint_dims.push([]);
  }

  //to do, agg update
  $scope.addNewAggregationGroup = function () {
    $scope.cubeMetaFrame.aggregation_groups.push(CubeDescModel.createAggGroup());
  };

  $scope.refreshAggregationGroup = function (list, index, aggregation_groups) {
    if (aggregation_groups) {
      list[index] = aggregation_groups;
    }
  };

  $scope.refreshAggregationHierarchy = function (list, index, aggregation_group,hieIndex,hierarchy) {
    if(hierarchy){
      aggregation_group.select_rule.hierarchy_dims[hieIndex] = hierarchy;
    }
    if (aggregation_group) {
      list[index] = aggregation_group;
    }
    console.log($scope.cubeMetaFrame.aggregation_groups);
  };

  $scope.refreshAggregationJoint = function (list, index, aggregation_group,joinIndex,jointDim){
    if(jointDim){
      aggregation_group.select_rule.joint_dims[joinIndex] = jointDim;
    }
    if (aggregation_group) {
      list[index] = aggregation_group;
    }
    console.log($scope.cubeMetaFrame.aggregation_groups);
  };

  $scope.refreshIncludes = function (list, index, aggregation_groups) {
    if (aggregation_groups) {
      list[index] = aggregation_groups;
    }
  };

  $scope.removeElement = function (arr, element) {
    var index = arr.indexOf(element);
    if (index > -1) {
      arr.splice(index, 1);
    }
  };

  $scope.removeHierarchy = function(arr,element){
    var index = arr.select_rule.hierarchy_dims.indexOf(element);
    if(index>-1){
      arr.select_rule.hierarchy_dims.splice(index,1);
    }

  }

  $scope.removeJointDims = function(arr,element){
    var index = arr.select_rule.joint_dims.indexOf(element);
    if(index>-1){
      arr.select_rule.joint_dims.splice(index,1);
    }

  }

  $scope.isReuse=false;
  $scope.addNew=false;
  $scope.newDictionaries = {
    "column":null,
    "builder": null,
    "reuse": null
  }

  $scope.initUpdateDictionariesStatus = function(){
    $scope.updateDictionariesStatus = {
      isEdit:false,
      editIndex:-1
    }
  };
  $scope.initUpdateDictionariesStatus();


  $scope.addNewDictionaries = function (dictionaries, index) {
    if(dictionaries&&index>=0){
      $scope.updateDictionariesStatus.isEdit = true;
      $scope.addNew=true;
      $scope.updateDictionariesStatus.editIndex = index;
      if(dictionaries.builder==null){
        $scope.isReuse=true;
      }
      else{
        $scope.isReuse=false;
      }
    }
    else{
      $scope.addNew=!$scope.addNew;
    }
    $scope.newDictionaries = (!!dictionaries)? jQuery.extend(true, {},dictionaries):CubeDescModel.createDictionaries();
  };

  $scope.saveNewDictionaries = function (){
    if(!$scope.cubeMetaFrame.dictionaries){
      $scope.cubeMetaFrame.dictionaries=[];
    }

    if($scope.updateDictionariesStatus.isEdit == true) {
      if ($scope.cubeMetaFrame.dictionaries[$scope.updateDictionariesStatus.editIndex].column != $scope.newDictionaries.column) {
        if(!$scope.checkColumn()){
          return false;
        }
      }
      else {
        $scope.cubeMetaFrame.dictionaries[$scope.updateDictionariesStatus.editIndex] = $scope.newDictionaries;
      }
    }
    else
      {
        if(!$scope.checkColumn()){
        return false;
        }
        $scope.cubeMetaFrame.dictionaries.push($scope.newDictionaries);
      }
      $scope.newDictionaries = null;
      $scope.initUpdateDictionariesStatus();
      $scope.nextDictionariesInit();
      $scope.addNew = !$scope.addNew;
      $scope.isReuse = false;
      return true;

  };

  $scope.nextDictionariesInit = function(){
    $scope.nextDic = {
      "coiumn":null,
      "builder":null,
      "reuse":null
    }
  }

  $scope.checkColumn = function (){
    var isColumnExit=false;
        angular.forEach($scope.cubeMetaFrame.dictionaries,function(dictionaries){
          if(!isColumnExit){
            if(dictionaries.column==$scope.newDictionaries.column)
              isColumnExit=true;
          }
        })
    if(isColumnExit){
      SweetAlert.swal('Oops...', "The column named [" + $scope.newDictionaries.column + "] already exists", 'warning');
      return false;
    }
    return true;
  }

  $scope.clearNewDictionaries = function (){
    $scope.newDictionaries = null;
    $scope.isReuse=false;
    $scope.initUpdateDictionariesStatus();
    $scope.nextDictionariesInit();
    $scope.addNew=!$scope.addNew;
  }

  $scope.change = function (){
    $scope.newDictionaries.builder=null;
    $scope.newDictionaries.reuse=null;
    $scope.isReuse=!$scope.isReuse;
  }

  $scope.removeDictionaries =  function(arr,element){
    var index = arr.indexOf(element);
    if (index > -1) {
      arr.splice(index, 1);
    }
  };

});